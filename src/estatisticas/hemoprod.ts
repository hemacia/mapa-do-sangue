import { type UF, siglaDaUF } from '../domain/ufs'
import { lerCSV } from './csv'

// Colunas do CSV nacional da Anvisa (Hemoprod), localizadas pelo nome.
const COLUNAS = {
  envio: 'Data de envio',
  ano: 'Ano de referência',
  periodo: 'Período de referência',
  nome: 'Razão Social - Nome Fantasia',
  cnpj: 'CNPJ',
  sangueTotal: '3.3 Total de coletas [Sangue total]',
  aferese: '3.3 Total de coletas [Por aférese]',
  uf: 'Unidade Federativa',
} as const

type Coluna = keyof typeof COLUNAS

export function agregarColetasPorUF(texto: string, ano: number): Partial<Record<UF, number>> {
  const [cabecalho, ...dados] = lerCSV(texto)
  const indice = Object.fromEntries(
    Object.entries(COLUNAS).map(([chave, nome]) => {
      const posicao = cabecalho.indexOf(nome)
      if (posicao < 0) throw new Error(`Coluna não encontrada: ${nome}`)
      return [chave, posicao]
    }),
  ) as Record<Coluna, number>

  // Retificações e duplicatas: vale o envio mais recente de cada estabelecimento e período.
  const ultimoEnvio = new Map<string, string[]>()
  for (const linha of dados) {
    if (Number(linha[indice.ano]) !== ano) continue
    const chave = [linha[indice.cnpj], linha[indice.nome], linha[indice.periodo]].join('|')
    const anterior = ultimoEnvio.get(chave)
    if (!anterior || linha[indice.envio] > anterior[indice.envio]) ultimoEnvio.set(chave, linha)
  }

  // SP, RJ e MG mandam um "Consolidado" anual: quando existe, os meses são ignorados.
  const comConsolidado = new Set(
    [...ultimoEnvio.values()]
      .filter((linha) => linha[indice.periodo] === 'Consolidado')
      .map((linha) => `${linha[indice.cnpj]}|${linha[indice.nome]}`),
  )

  const total: Partial<Record<UF, number>> = {}
  for (const linha of ultimoEnvio.values()) {
    const estabelecimento = `${linha[indice.cnpj]}|${linha[indice.nome]}`
    if (comConsolidado.has(estabelecimento) && linha[indice.periodo] !== 'Consolidado') continue
    const uf = siglaDaUF(linha[indice.uf])
    if (!uf) continue
    const coletas = (Number(linha[indice.sangueTotal]) || 0) + (Number(linha[indice.aferese]) || 0)
    total[uf] = (total[uf] ?? 0) + coletas
  }
  return total
}
