import { describe, expect, it } from 'vitest'
import { lerHemoba } from '../../../src/coleta/fontes/hemoba'
import { lerFixture } from './fixture'

describe('lerHemoba', () => {
  it('lê os oito cartões de posição de estoque', () => {
    const resultado = lerHemoba(lerFixture('hemoba.html'))

    expect(resultado.leituras).toHaveLength(8)
    expect(resultado.leituras).toContainEqual({ tipo: 'O-', nivel: 'critico' })
    expect(resultado.leituras).toContainEqual({ tipo: 'A+', nivel: 'estavel' })
  })

  it('falha quando recebe a página de desafio anti-robô', () => {
    const desafio = '<html><body><script>checando navegador</script></body></html>'

    expect(() => lerHemoba(desafio)).toThrow('Hemoba')
  })
})
