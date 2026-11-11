import { describe, expect, it } from 'vitest'
import { lerHemosc } from '../../../src/coleta/fontes/hemosc'
import { lerFixture } from './fixture'

const PAGINA = lerFixture('hemosc.html', 'latin1')

describe('lerHemosc', () => {
  it('lê a página em ISO-8859-1 sem quebrar os acentos', () => {
    expect(lerHemosc(PAGINA).leituras).toContainEqual({ tipo: 'A-', nivel: 'estavel' })
  })

  it('trata "Alerta" como o pior nível, como o próprio Hemosc define', () => {
    expect(lerHemosc(PAGINA).leituras).toContainEqual({ tipo: 'O-', nivel: 'critico' })
  })

  it('trata "Reduzido" como alerta', () => {
    expect(lerHemosc(PAGINA).leituras).toContainEqual({ tipo: 'O+', nivel: 'alerta' })
  })

  it('não duplica os tipos quando a página repete o bloco', () => {
    expect(lerHemosc(PAGINA).leituras).toHaveLength(8)
  })

  it('não informa data, porque a página não publica', () => {
    expect(lerHemosc(PAGINA).atualizadoNaFonte).toBeNull()
  })
})
