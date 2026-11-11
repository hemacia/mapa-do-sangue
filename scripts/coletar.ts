// Uso: npm run coletar -- [arquivo.sql]
// Baixa as fontes, mostra o resultado de cada uma e grava o SQL para o D1.
import { writeFileSync } from 'node:fs'
import { type Baixar, coletarTodas, gerarSQL } from '../src/coleta/coletar'
import { FONTES } from '../src/coleta/fontes'

const USER_AGENT = 'MapaDoSangue/0.1 (+https://github.com/hemacia/mapa-do-sangue)'

const baixar: Baixar = async (url) => {
  const resposta = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(30_000) })
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
  return resposta.arrayBuffer()
}

const agora = new Date()
const resultados = await coletarTodas(FONTES, baixar, agora)

for (const resultado of resultados) {
  if (resultado.ok) {
    const resumo = resultado.leituras.map((l) => `${l.tipo}=${l.nivel}`).join(' ')
    console.log(`ok    ${resultado.fonteId.padEnd(10)} ${resumo} (fonte: ${resultado.atualizadoNaFonte ?? 'sem data'})`)
  } else {
    // Anotação que aparece no resumo do GitHub Actions.
    console.log(`::warning title=Coleta ${resultado.fonteId}::${resultado.erro}`)
  }
}

const arquivo = process.argv[2] ?? 'coleta.sql'
writeFileSync(arquivo, gerarSQL(resultados, agora))
console.log(`SQL gravado em ${arquivo}`)

if (resultados.every((resultado) => !resultado.ok)) process.exit(1)
