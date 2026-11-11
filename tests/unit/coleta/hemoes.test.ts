import { describe, expect, it } from 'vitest'
import { parseData } from '../../../src/domain/datas'
import { lerHemoes } from '../../../src/coleta/fontes/hemoes'
import { lerFixture } from './fixture'

const COLETADO_EM = parseData('2026-11-10')

describe('lerHemoes', () => {
  it('lê os oito tipos do registro mais recente da API de dados abertos', () => {
    const resultado = lerHemoes(lerFixture('hemoes.json'), COLETADO_EM)

    expect(resultado.leituras).toHaveLength(8)
    expect(resultado.leituras).toContainEqual({ tipo: 'O-', nivel: 'critico' })
    expect(resultado.leituras).toContainEqual({ tipo: 'AB+', nivel: 'alerta' })
  })

  it('converte a data do registro para o formato ISO', () => {
    const resultado = lerHemoes(lerFixture('hemoes.json'), COLETADO_EM)

    expect(resultado.atualizadoNaFonte).toBe('2026-11-10')
  })

  it('falha quando a API não devolve nenhum registro', () => {
    const vazio = JSON.stringify({ success: true, result: { records: [] } })

    expect(() => lerHemoes(vazio, COLETADO_EM)).toThrow('HEMOES')
  })
})
