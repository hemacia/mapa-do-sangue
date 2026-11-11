import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { beforeEach, describe, expect, it } from 'vitest'

const MIGRATION = readFileSync(new URL('../../migrations/0001_schema_inicial.sql', import.meta.url), 'utf8')

let db: DatabaseSync

beforeEach(() => {
  db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(MIGRATION)
  db.exec(`INSERT INTO hemocentros (id, nome, uf, cidade) VALUES ('hemoes', 'HEMOES', 'ES', 'Vitória')`)
})

function inserirLeitura(tipo: string, nivel: string, hemocentro = 'hemoes') {
  db.prepare(
    `INSERT INTO leituras_estoque (hemocentro_id, tipo, nivel, coletado_em)
     VALUES (?, ?, ?, '2026-11-10T09:00:00Z')`,
  ).run(hemocentro, tipo, nivel)
}

describe('schema inicial', () => {
  it('grava uma leitura de estoque válida', () => {
    inserirLeitura('O-', 'critico')

    const linha = db.prepare('SELECT tipo, nivel FROM leituras_estoque').get()

    expect(linha).toEqual({ tipo: 'O-', nivel: 'critico' })
  })

  it('recusa tipo sanguíneo inexistente', () => {
    expect(() => inserirLeitura('C+', 'critico')).toThrow()
  })

  it('recusa nível fora da escala comum', () => {
    expect(() => inserirLeitura('O-', 'baixissimo')).toThrow()
  })

  it('recusa leitura de hemocentro não cadastrado', () => {
    expect(() => inserirLeitura('O-', 'critico', 'inexistente')).toThrow()
  })

  it('não duplica a mesma leitura na mesma coleta', () => {
    inserirLeitura('O-', 'critico')

    expect(() => inserirLeitura('O-', 'alerta')).toThrow()
  })

  it('recusa UF com formato inválido', () => {
    expect(() =>
      db.exec(`INSERT INTO hemocentros (id, nome, uf, cidade) VALUES ('x', 'X', 'Minas', 'BH')`),
    ).toThrow()
  })

  it('registra doação sem nenhum dado pessoal', () => {
    db.exec(`INSERT INTO doacoes_registradas (uf, tipo, data) VALUES ('MG', 'A+', '2026-11-10')`)

    const colunas = db.prepare('PRAGMA table_info(doacoes_registradas)').all().map((c) => c.name)

    expect(colunas).toEqual(['id', 'uf', 'tipo', 'data', 'criado_em'])
  })
})
