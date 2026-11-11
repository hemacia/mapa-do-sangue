import { describe, expect, it } from 'vitest'
import { lerHemopi } from '../../../src/coleta/fontes/hemopi'
import { lerFixture } from './fixture'

describe('lerHemopi', () => {
  it('lê só as hemácias e ignora os itens de plaquetas', () => {
    const resultado = lerHemopi(lerFixture('hemopi.json'))

    expect(resultado.leituras).toHaveLength(8)
    expect(resultado.leituras).toContainEqual({ tipo: 'O+', nivel: 'critico' })
  })

  it('converte "Regular" para alerta', () => {
    const resultado = lerHemopi(lerFixture('hemopi.json'))

    expect(resultado.leituras).toContainEqual({ tipo: 'O-', nivel: 'alerta' })
  })

  it('usa a data de modificação do registro, sem os segundos', () => {
    expect(lerHemopi(lerFixture('hemopi.json')).atualizadoNaFonte).toBe('2026-11-10T10:41')
  })

  it('falha quando o endpoint devolve lista vazia', () => {
    expect(() => lerHemopi('[]')).toThrow('Hemopi')
  })
})
