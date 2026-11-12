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
