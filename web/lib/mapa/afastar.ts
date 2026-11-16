export interface Caixa {
  id: string
  left: number
  right: number
  top: number
  bottom: number
}

const batem = (a: Caixa, b: Caixa, folga: number) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom + folga && b.top < a.bottom + folga

// Posiciona as caixas de cima para baixo. A que bate numa já posicionada ou num obstáculo fixo vai para
// a posição livre mais próxima, logo acima ou logo abaixo de quem atrapalha (em px, com folga).
// Devolve o deslocamento vertical de cada id; zero quando a caixa já estava livre.
export function afastarCaixas(caixas: Caixa[], folga = 4, fixas: Caixa[] = []): Map<string, number> {
  const deslocamentos = new Map<string, number>()
  const postas: Caixa[] = [...fixas]
  for (const original of [...caixas].sort((a, b) => a.top - b.top)) {
    const altura = original.bottom - original.top
    const em = (top: number) => ({ ...original, top, bottom: top + altura })
    const livre = (top: number) => !postas.some((outra) => batem(em(top), outra, folga))
    const candidatos = [
      original.top,
      ...postas.flatMap((outra) => [outra.bottom + folga, outra.top - folga - altura]),
    ].sort((a, b) => Math.abs(a - original.top) - Math.abs(b - original.top))
    const top = candidatos.find(livre) ?? original.top
    postas.push(em(top))
    deslocamentos.set(original.id, top - original.top)
  }
  return deslocamentos
}
