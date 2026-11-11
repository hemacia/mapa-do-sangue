import { describe, expect, it } from 'vitest'
import { lerUnicamp } from '../../../src/coleta/fontes/unicamp'
import { lerFixture } from './fixture'

describe('lerUnicamp', () => {
  it('lê o nível pelo nome da imagem de cada tipo', () => {
    const resultado = lerUnicamp(lerFixture('unicamp.html'))

    expect(resultado.leituras).toContainEqual({ tipo: 'O+', nivel: 'critico' })
    expect(resultado.leituras).toContainEqual({ tipo: 'A+', nivel: 'estavel' })
    expect(resultado.leituras).toContainEqual({ tipo: 'O-', nivel: 'alerta' })
  })

  it('ignora os cartões da legenda, que não são tipos sanguíneos', () => {
    expect(lerUnicamp(lerFixture('unicamp.html')).leituras).toHaveLength(8)
  })

  it('lê a data da última atualização', () => {
    expect(lerUnicamp(lerFixture('unicamp.html')).atualizadoNaFonte).toBe('2026-11-10')
  })

  it('falha quando a página não tem cartões de estoque', () => {
    expect(() => lerUnicamp('<html></html>')).toThrow('Unicamp')
  })
})
