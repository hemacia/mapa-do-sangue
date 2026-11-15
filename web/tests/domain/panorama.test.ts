import { describe, expect, it } from 'vitest'
import {
  juntarTipos,
  montarManchete,
  panoramaPorTipo,
  tiposCriticos,
  tiposMaisEmFalta,
} from '@/lib/domain/panorama'

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

describe('tiposCriticos', () => {
  it('lista, na ordem dos tipos, só os que estão críticos', () => {
    expect(tiposCriticos({ 'O-': 'critico', 'A+': 'critico', 'B+': 'alerta' })).toEqual(['A+', 'O-'])
  })
})

describe('juntarTipos', () => {
  it.each([
    [[], ''],
    [['O-'], 'O-'],
    [['O-', 'O+'], 'O- e O+'],
    [['A-', 'B-', 'O-'], 'A-, B- e O-'],
  ])('junta %j como "%s"', (tipos, esperado) => {
    expect(juntarTipos(tipos)).toBe(esperado)
  })
})

describe('montarManchete', () => {
  const todos = (criticos: Partial<Record<string, number>>) =>
    panoramaPorTipo([]).map((p) => ({ ...p, criticos: criticos[p.tipo] ?? 0, informados: 6 }))

  it('diz quando o tipo está crítico em todos os hemocentros e cita o segundo colocado', () => {
    const manchete = montarManchete(todos({ 'O-': 6, 'O+': 4, 'A-': 3 }), 6)

    expect(manchete.titulo).toBe('O- está crítico nos 6 hemocentros que publicam')
    expect(manchete.complemento).toBe('O+ está crítico em 4 deles.')
    expect(manchete.tipos).toEqual(['O-'])
  })

  it('usa o plural e "em X dos N" quando não são todos', () => {
    const manchete = montarManchete(todos({ 'A-': 3, 'O-': 3 }), 6)

    expect(manchete.titulo).toBe('A- e O- estão críticos em 3 dos 6 hemocentros que publicam')
    expect(manchete.complemento).toBeNull()
  })

  it('avisa quando nenhum tipo está crítico', () => {
    expect(montarManchete(todos({}), 6)).toEqual({
      tipos: [],
      titulo: 'Nenhum tipo está crítico nos 6 hemocentros que publicam',
      complemento: null,
    })
  })
})
