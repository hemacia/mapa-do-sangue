import { describe, expect, it } from 'vitest'
import { lerHemominas } from '../../../src/coleta/fontes/hemominas'
import { lerFixture } from './fixture'

describe('lerHemominas', () => {
  it('lê os oito tipos do bloco de estoque da rede', () => {
    const resultado = lerHemominas(lerFixture('hemominas.html'))

    expect(resultado.leituras).toHaveLength(8)
    expect(resultado.leituras).toContainEqual({ tipo: 'O+', nivel: 'critico' })
    expect(resultado.leituras).toContainEqual({ tipo: 'B+', nivel: 'alerta' })
  })

  it('inverte estável e adequado, porque na Hemominas estável é o melhor nível', () => {
    const resultado = lerHemominas(lerFixture('hemominas.html'))

    expect(resultado.leituras).toContainEqual({ tipo: 'AB+', nivel: 'adequado' })
    expect(resultado.leituras).toContainEqual({ tipo: 'AB-', nivel: 'estavel' })
  })

  it('lê data e hora da atualização', () => {
    expect(lerHemominas(lerFixture('hemominas.html')).atualizadoNaFonte).toBe('2026-11-10T12:35')
  })

  it('falha quando a página não tem o bloco de estoque', () => {
    expect(() => lerHemominas('<html><body>Manutenção</body></html>')).toThrow('Hemominas')
  })
})
