import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { type Baixar, coletarTodas, gerarSQL } from '../../../src/coleta/coletar'
import { FONTES } from '../../../src/coleta/fontes'
import { bancoComMigrations } from '../banco'

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
  it('gera inserts que o banco aceita, com uma linha por tipo e fonte', async () => {
    const db = bancoComMigrations()
    const resultados = await coletarTodas(FONTES, baixarFixtures, COLETADO_EM)

    db.exec(gerarSQL(resultados, COLETADO_EM))

    const { total } = db.prepare('SELECT count(*) AS total FROM leituras_estoque').get() as { total: number }
    expect(total).toBe(48)
  })

  it('marca a última coleta bem-sucedida só nas fontes que funcionaram', () => {
    const db = bancoComMigrations()
    const resultados = [
      { fonteId: 'hemoba', ok: true as const, leituras: [{ tipo: 'O-' as const, nivel: 'critico' as const }], atualizadoNaFonte: null },
      { fonteId: 'hemosc', ok: false as const, erro: 'HTTP 500' },
    ]

    db.exec(gerarSQL(resultados, COLETADO_EM))

    const fontes = db.prepare('SELECT id, ultima_coleta_ok FROM fontes ORDER BY id').all()
    expect(fontes).toContainEqual({ id: 'hemoba', ultima_coleta_ok: '2026-11-10T09:00:00Z' })
    expect(fontes).toContainEqual({ id: 'hemosc', ultima_coleta_ok: null })
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
  it('tem um hemocentro e uma fonte cadastrados no banco para cada fonte do código', () => {
    const db = bancoComMigrations()

    const ids = db.prepare('SELECT f.id FROM fontes f JOIN hemocentros h ON h.id = f.hemocentro_id ORDER BY f.id').all()

    expect(ids.map((linha) => linha.id)).toEqual(FONTES.map((f) => f.id).sort())
  })
})
