export const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

export type TipoSanguineo = (typeof TIPOS_SANGUINEOS)[number]

// Hemocentros escrevem "O-", "O –", "O negativo", "Sangue tipo O NEG"...
const PADRAO_TIPO = /\b(AB|A|B|O)\s*(\+|-|–|−|POS(?:ITIVO)?\b|NEG(?:ATIVO)?\b)/i

export function normalizarTipo(texto: string): TipoSanguineo | null {
  const partes = PADRAO_TIPO.exec(texto)
  if (!partes) return null
  const grupo = partes[1].toUpperCase()
  const rh = /^(\+|POS)/i.test(partes[2]) ? '+' : '-'
  return `${grupo}${rh}` as TipoSanguineo
}
