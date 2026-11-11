import { readFileSync, readdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

// Banco em memória com todas as migrations, igual ao D1 depois do deploy.
export function bancoComMigrations(): DatabaseSync {
  const db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  const pasta = new URL('../../migrations/', import.meta.url)
  for (const arquivo of readdirSync(pasta).filter((nome) => nome.endsWith('.sql')).sort()) {
    db.exec(readFileSync(new URL(arquivo, pasta), 'utf8'))
  }
  return db
}
