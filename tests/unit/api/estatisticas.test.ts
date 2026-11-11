import { describe, expect, it } from 'vitest'
import { CONSULTA_ESTATISTICAS, type LinhaEstatistica, montarEstatisticas } from '../../../src/api/estatisticas'
import { bancoComMigrations } from '../banco'

describe('estatísticas por UF', () => {
  it('devolve o ano mais recente com taxa por mil e cobertura, da maior taxa para a menor', () => {
    const db = bancoComMigrations()
    db.exec('DELETE FROM estatisticas_uf')
    db.exec(`INSERT INTO estatisticas_uf (uf, ano, coletas, populacao) VALUES
      ('ES', 2024, 89062, 4102129), ('DF', 2024, 5182, 2982818), ('ES', 2023, 1, 1)`)

    const linhas = db.prepare(CONSULTA_ESTATISTICAS).all() as unknown as LinhaEstatistica[]
    const resultado = montarEstatisticas(linhas)

    expect(resultado).toEqual([
      { uf: 'ES', ano: 2024, coletas: 89062, populacao: 4102129, porMil: 21.7, cobertura: 'completo' },
      { uf: 'DF', ano: 2024, coletas: 5182, populacao: 2982818, porMil: 1.7, cobertura: 'incompleto' },
    ])
  })

  it('traz as 27 UFs de 2024 carregadas pela migration', () => {
    const db = bancoComMigrations()

    const linhas = db.prepare(CONSULTA_ESTATISTICAS).all()

    expect(linhas).toHaveLength(27)
  })
})
