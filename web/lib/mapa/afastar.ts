export interface Caixa {
  id: string
  left: number
  right: number
  top: number
  bottom: number
}

// Empurra para baixo, de cima para baixo, a caixa que bate numa já posicionada (em px, com folga).
// Devolve o deslocamento vertical de cada id; zero quando a caixa já estava livre.
export function afastarCaixas(caixas: Caixa[], folga = 4): Map<string, number> {
  const deslocamentos = new Map<string, number>()
  const postas: Caixa[] = []
  for (const original of [...caixas].sort((a, b) => a.top - b.top)) {
    const caixa = { ...original }
    let bateu = true
    while (bateu) {
      bateu = false
      for (const outra of postas) {
        const ladoALado = caixa.left < outra.right && outra.left < caixa.right
        if (ladoALado && caixa.top < outra.bottom + folga && outra.top < caixa.bottom + folga) {
          const altura = caixa.bottom - caixa.top
          caixa.top = outra.bottom + folga
          caixa.bottom = caixa.top + altura
          bateu = true
        }
      }
    }
    postas.push(caixa)
    deslocamentos.set(caixa.id, caixa.top - original.top)
  }
  return deslocamentos
}
