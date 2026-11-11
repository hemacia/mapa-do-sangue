import { describe, expect, it } from 'vitest'
import { panoramaPorTipo, tiposMaisEmFalta } from '../../src/domain/panorama'

const HEMOCENTROS = [
  { estoque: { 'O-': 'critico', 'A+': 'estavel', 'B+': 'adequado' } },
  { estoque: { 'O-': 'critico', 'A+': 'critico' } },
  { estoque: { 'O-': 'alerta' } },
] as const

describe('panoramaPorTipo', () => {
  it('conta em quantos hemocentros cada tipo está crítico', () => {
    const oNegativo = panoramaPorTipo([...HEMOCENTROS]).find((p) => p.tipo === 'O-')

    expect(oNegativo).toMatchObject({ criticos: 2, informados: 3 })
  })

  it('calcula quanto a bolsa está cheia pela média dos níveis', () => {
    const bPositivo = panoramaPorTipo([...HEMOCENTROS]).find((p) => p.tipo === 'B+')

    expect(bPositivo?.preenchimento).toBe(1)
  })

  it('deixa o preenchimento nulo para tipo sem nenhuma informação', () => {
    const abNegativo = panoramaPorTipo([...HEMOCENTROS]).find((p) => p.tipo === 'AB-')

    expect(abNegativo).toMatchObject({ informados: 0, preenchimento: null })
  })

  it('sempre devolve os oito tipos', () => {
    expect(panoramaPorTipo([])).toHaveLength(8)
  })
})

describe('tiposMaisEmFalta', () => {
  it('lista os tipos com mais hemocentros em nível crítico', () => {
    expect(tiposMaisEmFalta(panoramaPorTipo([...HEMOCENTROS]))).toEqual(['O-'])
  })

  it('inclui empates', () => {
    const empate = [{ estoque: { 'A-': 'critico' } }, { estoque: { 'B-': 'critico' } }] as const

    expect(tiposMaisEmFalta(panoramaPorTipo([...empate]))).toEqual(['A-', 'B-'])
  })

  it('devolve lista vazia quando nenhum tipo está crítico', () => {
    expect(tiposMaisEmFalta(panoramaPorTipo([{ estoque: { 'O+': 'estavel' } }]))).toEqual([])
  })
})
