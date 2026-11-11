// Do mais grave para o menos grave: a ordem é usada para comparar.
export const NIVEIS_ESTOQUE = ['critico', 'alerta', 'estavel', 'adequado'] as const

export type NivelEstoque = (typeof NIVEIS_ESTOQUE)[number]

const SINONIMOS: Record<string, NivelEstoque> = {
  critico: 'critico',
  emergencia: 'critico',
  alerta: 'alerta',
  reduzido: 'alerta',
  regular: 'alerta',
  baixo: 'alerta',
  estavel: 'estavel',
  adequado: 'adequado',
}

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

// Cada hemocentro dá um sentido diferente às palavras: no Hemosc "Alerta" é o pior nível.
export type EscalaDaFonte = Partial<Record<string, NivelEstoque>>

export function normalizarNivel(texto: string, escala: EscalaDaFonte = {}): NivelEstoque | null {
  const chave = semAcento(texto).trim().toLowerCase()
  return escala[chave] ?? SINONIMOS[chave] ?? null
}

export function nivelMaisGrave(niveis: NivelEstoque[]): NivelEstoque | null {
  if (niveis.length === 0) return null
  return niveis.reduce((pior, atual) =>
    NIVEIS_ESTOQUE.indexOf(atual) < NIVEIS_ESTOQUE.indexOf(pior) ? atual : pior,
  )
}
