export type Cobertura = 'completo' | 'incompleto' | 'sem-dado'

// A média nacional fica perto de 16 coletas por mil habitantes. Abaixo de 5, o estado
// quase certamente deixou de enviar dados à Anvisa (caso de MA, PI e DF em 2024).
const MINIMO_PLAUSIVEL = 5

export function taxaPorMil(coletas: number, populacao: number): number | null {
  if (!(populacao > 0)) return null
  return Math.round((coletas / populacao) * 10_000) / 10
}

export function classificarCobertura(porMil: number | null): Cobertura {
  if (porMil === null) return 'sem-dado'
  return porMil < MINIMO_PLAUSIVEL ? 'incompleto' : 'completo'
}

// Limites das cinco faixas do mapa, em coletas por mil habitantes.
export const LIMITES_FAIXAS = [12, 15, 18, 21] as const

export type FaixaColetas = 0 | 1 | 2 | 3 | 4 | 'incompleto' | null

export function faixaDeColetas(porMil: number | null, cobertura: Cobertura): FaixaColetas {
  if (cobertura === 'incompleto') return 'incompleto'
  if (porMil === null || cobertura === 'sem-dado') return null
  return LIMITES_FAIXAS.filter((limite) => porMil >= limite).length as FaixaColetas
}

interface ComTaxa {
  uf: string
  porMil: number | null
  cobertura: Cobertura
}

export interface Posicao {
  posicao: number
  total: number
  mediana: number
}

// Só entram no ranking os estados com envio completo à Anvisa.
export function posicaoNoRanking(estatisticas: ComTaxa[], uf: string): Posicao | null {
  const validas = estatisticas
    .filter((e): e is ComTaxa & { porMil: number } => e.cobertura === 'completo' && e.porMil !== null)
    .sort((a, b) => b.porMil - a.porMil)
  const indice = validas.findIndex((e) => e.uf === uf)
  if (indice < 0) return null
  const taxas = validas.map((e) => e.porMil).sort((a, b) => a - b)
  const meio = Math.floor(taxas.length / 2)
  const mediana = taxas.length % 2 ? taxas[meio] : (taxas[meio - 1] + taxas[meio]) / 2
  return { posicao: indice + 1, total: validas.length, mediana }
}
