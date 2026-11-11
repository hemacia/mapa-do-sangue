import { describe, expect, it } from 'vitest'
import { CONSULTA_HISTORICO, type LinhaHistorico, anexarHistorico } from '../../../src/api/historico'
import { bancoComMigrations } from '../banco'

function inserir(db: ReturnType<typeof bancoComMigrations>, tipo: string, nivel: string, coletadoEm: string) {
  db.prepare(
    `INSERT INTO leituras_estoque (hemocentro_id, tipo, nivel, coletado_em) VALUES ('hemoes', ?, ?, ?)`,
  ).run(tipo, nivel, coletadoEm)
}

describe('histórico de dias críticos', () => {
  it('conta dias distintos em nível crítico nos últimos 30 dias', () => {
    const db = bancoComMigrations()
    inserir(db, 'O-', 'critico', '2026-11-10T12:00:00Z')
    inserir(db, 'O-', 'critico', '2026-11-10T18:00:00Z')
    inserir(db, 'O-', 'estavel', '2026-11-09T12:00:00Z')
    inserir(db, 'O-', 'critico', '2026-11-08T12:00:00Z')
    inserir(db, 'O-', 'critico', '2026-09-01T12:00:00Z')

    const linhas = db.prepare(CONSULTA_HISTORICO).all('2026-10-11') as unknown as LinhaHistorico[]

    expect(linhas).toEqual([{ hemocentro_id: 'hemoes', tipo: 'O-', dias: 3, dias_criticos: 2 }])
  })

  it('anexa o histórico ao estoque de cada hemocentro', () => {
    const estoque = [{ id: 'hemoes' }, { id: 'hemopi' }]
    const historico = [{ hemocentro_id: 'hemoes', tipo: 'O-' as const, dias: 3, dias_criticos: 2 }]

    expect(anexarHistorico(estoque, historico)).toEqual([
      { id: 'hemoes', historico: { 'O-': { dias: 3, diasCriticos: 2 } } },
      { id: 'hemopi', historico: {} },
    ])
  })
})
