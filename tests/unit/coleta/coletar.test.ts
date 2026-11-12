import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { type Baixar, coletarTodas, gerarSQL } from '../../../src/coleta/coletar'
import { FONTES } from '../../../src/coleta/fontes'

const COLETADO_EM = new Date('2026-11-10T09:00:00Z')

function bytesDaFixture(nome: string) {
  return readFileSync(new URL(`../../fixtures/${nome}`, import.meta.url))
}

const FIXTURE_POR_FONTE: Record<string, string> = {
  hemoes: 'hemoes.json',
  hemopi: 'hemopi.json',
  hemominas: 'hemominas.html',
  unicamp: 'unicamp.html',
  hemosc: 'hemosc.html',
  hemoba: 'hemoba.html',
}

const baixarFixtures: Baixar = async (url) => {
  const fonte = FONTES.find((f) => f.url === url)!
  return bytesDaFixture(FIXTURE_POR_FONTE[fonte.id])
}

describe('coletarTodas', () => {
  it('lê as seis fontes a partir das páginas baixadas', async () => {
    const resultados = await coletarTodas(FONTES, baixarFixtures, COLETADO_EM)

    expect(resultados.map((r) => r.ok)).toEqual([true, true, true, true, true, true])
  })

  it('decodifica o Hemosc como latin1', async () => {
    const resultados = await coletarTodas(FONTES, baixarFixtures, COLETADO_EM)

    const hemosc = resultados.find((r) => r.fonteId === 'hemosc')
    expect(hemosc).toMatchObject({ ok: true, leituras: expect.arrayContaining([{ tipo: 'A-', nivel: 'estavel' }]) })
  })

  it('continua coletando as outras fontes quando uma falha', async () => {
    const baixarComFalha: Baixar = async (url) => {
      if (url.includes('hemominas')) throw new Error('tempo esgotado')
      return baixarFixtures(url)
    }

    const resultados = await coletarTodas(FONTES, baixarComFalha, COLETADO_EM)

    expect(resultados.find((r) => r.fonteId === 'hemominas')).toEqual({
      fonteId: 'hemominas',
      ok: false,
      erro: 'tempo esgotado',
    })
    expect(resultados.filter((r) => r.ok)).toHaveLength(5)
  })
})

describe('gerarSQL', () => {
  it('gera um insert por tipo e fonte', async () => {
    const resultados = await coletarTodas(FONTES, baixarFixtures, COLETADO_EM)

    const sql = gerarSQL(resultados, COLETADO_EM)

    expect(sql.match(/^INSERT INTO leituras_estoque/gm)).toHaveLength(48)
  })

  it('marca a última coleta bem-sucedida só nas fontes que funcionaram', () => {
    const resultados = [
      { fonteId: 'hemoba', ok: true as const, leituras: [{ tipo: 'O-' as const, nivel: 'critico' as const }], atualizadoNaFonte: null },
      { fonteId: 'hemosc', ok: false as const, erro: 'HTTP 500' },
    ]

    const sql = gerarSQL(resultados, COLETADO_EM)

    expect(sql).toContain("UPDATE fontes SET ultima_coleta_ok = '2026-11-10T09:00:00Z' WHERE id = 'hemoba';")
    expect(sql).not.toContain("'hemosc'")
  })

  it('escapa aspas simples vindas da fonte', () => {
    const resultados = [
      { fonteId: 'hemoba', ok: true as const, leituras: [{ tipo: 'O-' as const, nivel: 'critico' as const }], atualizadoNaFonte: "2026'); DROP TABLE x; --" },
    ]

    expect(gerarSQL(resultados, COLETADO_EM)).toContain("'2026''); DROP TABLE x; --'")
  })

  it('devolve SQL vazio quando nenhuma fonte funcionou', () => {
    expect(gerarSQL([{ fonteId: 'hemoba', ok: false, erro: 'x' }], COLETADO_EM)).toBe('')
  })
})

describe('FONTES', () => {
  it('tem uma fonte cadastrada na migration da API para cada fonte do código', () => {
    const migration = readFileSync(new URL('../../../api/migrations/00002_fontes_iniciais.sql', import.meta.url), 'utf8')
    const insertFontes = migration.slice(migration.indexOf('INSERT INTO fontes'))

    const ids = [...insertFontes.matchAll(/^ {2}\('([a-z]+)'/gm)].map((m) => m[1])

    expect(ids.sort()).toEqual(FONTES.map((f) => f.id).sort())
  })
})
