// Gera tests/e2e/seed.sql a partir das fixtures, com data fixa: o e2e não depende da internet.
import { readFileSync, writeFileSync } from 'node:fs'
import { coletarTodas, gerarSQL } from '../src/coleta/coletar'
import { FONTES } from '../src/coleta/fontes'

const ARQUIVOS: Record<string, string> = {
  hemoes: 'hemoes.json', hemopi: 'hemopi.json', hemominas: 'hemominas.html',
  unicamp: 'unicamp.html', hemosc: 'hemosc.html', hemoba: 'hemoba.html',
}
const coletadoEm = new Date('2026-11-10T12:00:00Z')
const resultados = await coletarTodas(
  FONTES,
  async (url) => readFileSync(`tests/fixtures/${ARQUIVOS[FONTES.find((f) => f.url === url)!.id]}`),
  coletadoEm,
)
writeFileSync('tests/e2e/seed.sql', gerarSQL(resultados, coletadoEm) + '\n')
