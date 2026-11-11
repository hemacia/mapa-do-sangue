// Gera migrations/0003_estatisticas_<ano>.sql com coletas da Anvisa e população do IBGE.
// Uso: npx tsx scripts/gerar-estatisticas.ts caminho/hemoprod_nacional.csv 2024
// CSV: https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica
import { readFileSync, writeFileSync } from 'node:fs'
import { siglaDaUF, UFS } from '../src/domain/ufs'
import { agregarColetasPorUF } from '../src/estatisticas/hemoprod'

const [arquivo, anoTexto = '2024'] = process.argv.slice(2)
if (!arquivo) throw new Error('Informe o caminho do CSV do Hemoprod')
const ano = Number(anoTexto)

const coletas = agregarColetasPorUF(readFileSync(arquivo, 'utf8'), ano)

const resposta = await fetch(
  `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/${ano}/variaveis/9324?localidades=N3[all]`,
)
const series = (await resposta.json())[0].resultados[0].series as {
  localidade: { nome: string }
  serie: Record<string, string>
}[]
const populacao = Object.fromEntries(series.map((s) => [siglaDaUF(s.localidade.nome), Number(s.serie[String(ano)])]))

const valores = UFS.map((uf) => `  ('${uf}', ${ano}, ${coletas[uf] ?? 'NULL'}, ${populacao[uf]})`).join(',\n')
writeFileSync(
  `migrations/0003_estatisticas_${ano}.sql`,
  `-- Coletas (sangue total + aférese): Anvisa, Hemoprod ${ano}. População: IBGE, estimativa ${ano}.\n` +
    `-- Gerado por scripts/gerar-estatisticas.ts. NULL = estado sem nenhum envio no ano.\n` +
    `INSERT INTO estatisticas_uf (uf, ano, coletas, populacao) VALUES\n${valores};\n`,
)
