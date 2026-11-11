import { beforeEach, describe, expect, it } from 'vitest'
import { CONSULTA_ESTOQUE_ATUAL, type LinhaEstoque, agruparPorHemocentro } from '../../../src/api/estoque'
import { bancoComMigrations } from '../banco'

let db: ReturnType<typeof bancoComMigrations>

function inserir(hemocentro: string, tipo: string, nivel: string, coletadoEm: string) {
  db.prepare(
    `INSERT INTO leituras_estoque (hemocentro_id, tipo, nivel, atualizado_na_fonte, coletado_em)
     VALUES (?, ?, ?, '2026-11-10', ?)`,
  ).run(hemocentro, tipo, nivel, coletadoEm)
}

function consultar() {
  return db.prepare(CONSULTA_ESTOQUE_ATUAL).all() as unknown as LinhaEstoque[]
}

beforeEach(() => {
  db = bancoComMigrations()
})

describe('CONSULTA_ESTOQUE_ATUAL', () => {
  it('devolve só a coleta mais recente de cada hemocentro', () => {
    inserir('hemoes', 'O-', 'estavel', '2026-11-09T12:00:00Z')
    inserir('hemoes', 'O-', 'critico', '2026-11-10T12:00:00Z')

    const linhas = consultar()

    expect(linhas).toHaveLength(1)
    expect(linhas[0]).toMatchObject({ hemocentro_id: 'hemoes', tipo: 'O-', nivel: 'critico' })
  })

  it('mantém hemocentros com datas de coleta diferentes', () => {
    inserir('hemoes', 'O-', 'critico', '2026-11-10T12:00:00Z')
    inserir('hemopi', 'A+', 'alerta', '2026-11-09T18:00:00Z')

    expect(consultar().map((linha) => linha.hemocentro_id).sort()).toEqual(['hemoes', 'hemopi'])
  })
})

describe('agruparPorHemocentro', () => {
  it('junta as leituras de cada hemocentro e calcula o nível mais grave', () => {
    inserir('hemoes', 'O-', 'critico', '2026-11-10T12:00:00Z')
    inserir('hemoes', 'A+', 'estavel', '2026-11-10T12:00:00Z')

    const [hemoes] = agruparPorHemocentro(consultar())

    expect(hemoes).toMatchObject({
      id: 'hemoes',
      nome: 'HEMOES',
      uf: 'ES',
      nivelGeral: 'critico',
      estoque: { 'O-': 'critico', 'A+': 'estavel' },
      coletadoEm: '2026-11-10T12:00:00Z',
    })
  })

  it('devolve lista vazia quando ainda não houve coleta', () => {
    expect(agruparPorHemocentro([])).toEqual([])
  })
})
