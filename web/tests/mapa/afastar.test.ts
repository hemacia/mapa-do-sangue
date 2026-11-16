import { describe, expect, it } from 'vitest'
import { afastarCaixas } from '@/lib/mapa/afastar'

const caixa = (id: string, left: number, top: number, largura = 100, altura = 30) => ({
  id,
  left,
  right: left + largura,
  top,
  bottom: top + altura,
})

describe('afastarCaixas', () => {
  it('não mexe em caixas que já estão livres', () => {
    const d = afastarCaixas([caixa('MG', 0, 0), caixa('SC', 0, 100), caixa('BA', 300, 10)])

    expect([...d.values()]).toEqual([0, 0, 0])
  })

  it('empurra para baixo a caixa que bate na de cima, com folga', () => {
    const d = afastarCaixas([caixa('MS', 20, 20), caixa('MG', 0, 0)], 4)

    expect(d.get('MG')).toBe(0)
    expect(d.get('MS')).toBe(14) // 0 + 30 + 4 = 34; estava em 20
  })

  it('resolve uma pilha indo para o lado livre mais perto', () => {
    const d = afastarCaixas([caixa('A', 0, 0), caixa('B', 0, 5), caixa('C', 0, 10)], 0)

    expect(d.get('B')).toBe(25) // logo abaixo de A
    expect(d.get('C')).toBe(-40) // subir 40 é mais perto que descer 50
  })

  it('também desvia dos obstáculos fixos, como o ponto de outro estado', () => {
    const ponto = caixa('ponto-MS', 50, 40, 10, 10)

    const d = afastarCaixas([caixa('MG', 0, 25)], 4, [ponto])

    expect(d.get('MG')).toBe(-19) // acima do ponto: 40 - 4 - 30 = 6, mais perto que descer para 54
    expect(d.has('ponto-MS')).toBe(false)
  })
})
