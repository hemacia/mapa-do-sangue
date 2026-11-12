import { describe, expect, it } from 'vitest'
import { desenharEstados } from '@/lib/mapa/geografia'

describe('desenho dos estados', () => {
  it('gera um contorno para cada uma das 27 UFs', () => {
    const estados = desenharEstados(600, 600)

    expect(estados.map((e) => e.uf).sort()).toHaveLength(27)
    expect(new Set(estados.map((e) => e.uf)).size).toBe(27)
    expect(estados.every((e) => e.d.startsWith('M'))).toBe(true)
  })

  it('mantém cada estado dentro do quadro (contorno no sentido certo)', () => {
    const estados = desenharEstados(600, 600)

    for (const estado of estados) {
      expect(estado.area, estado.uf).toBeLessThan(600 * 600 * 0.3)
      expect(estado.centro[0]).toBeGreaterThanOrEqual(0)
      expect(estado.centro[0]).toBeLessThanOrEqual(600)
    }
  })

  it('desenha Minas Gerais maior que o Distrito Federal', () => {
    const estados = desenharEstados(600, 600)
    const area = (uf: string) => estados.find((e) => e.uf === uf)?.area ?? 0

    expect(area('MG')).toBeGreaterThan(area('DF') * 50)
  })
})
