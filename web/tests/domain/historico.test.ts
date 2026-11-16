import { describe, expect, it } from 'vitest'
import type { EstatisticaUF } from '@/lib/api/cliente'
import {
  barrasDoBrasil,
  barrasDoEstado,
  indicadoresNacionais,
  parciaisPorEstado,
  parcialNacional,
  periodoParcial,
  resumoNacional,
  tabelaPorEstado,
} from '@/lib/domain/historico'

const estado = (uf: string, serie: EstatisticaUF['serie'], parcial?: EstatisticaUF['parcial']) =>
  ({
    uf,
    ano: 2025,
    coletas: 1,
    populacao: 1,
    porMil: 1,
    cobertura: 'completo',
    serie,
    parcial,
  }) as EstatisticaUF

describe('histórico', () => {
  it('marca como incompleto o ano do estado com menos de 5 por mil', () => {
    const barras = barrasDoEstado([
      { ano: 2024, coletas: 5182, porMil: 1.7 },
      { ano: 2025, coletas: 28240, porMil: 9.4 },
      { ano: 2026, coletas: null, porMil: null },
    ])

    expect(barras).toEqual([
      { ano: 2024, valor: 1.7, incompleto: true },
      { ano: 2025, valor: 9.4, incompleto: false },
      { ano: 2026, valor: null, incompleto: false },
    ])
  })

  it('soma o Brasil por ano e conta os estados que faltaram', () => {
    const barras = barrasDoBrasil([
      estado('SP', [
        { ano: 2010, coletas: 1000, porMil: 20 },
        { ano: 2011, coletas: 1100, porMil: 21 },
      ]),
      estado('MA', [
        { ano: 2010, coletas: 0, porMil: 0 },
        { ano: 2011, coletas: 300, porMil: 12 },
      ]),
    ])

    expect(barras).toEqual([
      { ano: 2010, valor: 1000, incompleto: false, faltando: 1 },
      { ano: 2011, valor: 1400, incompleto: false, faltando: 0 },
    ])
  })

  it('marca o ano do Brasil como incompleto com 5 estados ou mais faltando', () => {
    const faltou = (uf: string) => estado(uf, [{ ano: 2021, coletas: 0, porMil: 0 }])
    const barras = barrasDoBrasil(['PR', 'MT', 'SE', 'PE', 'AP'].map(faltou))

    expect(barras[0]).toMatchObject({ incompleto: true, faltando: 5 })
  })

  it('junta o comparativo do ano em andamento dos estados', () => {
    const p = parcialNacional([
      estado('SC', [], { ano: 2026, ateMes: 3, coletas: 110, coletasAnoAnterior: 100 }),
      estado('BA', [], { ano: 2026, ateMes: 3, coletas: 90, coletasAnoAnterior: 100 }),
      estado('SP', []),
    ])

    expect(p).toEqual({ ano: 2026, ateMes: 3, percentual: 0, estados: 2 })
    expect(parcialNacional([estado('SP', [])])).toBeNull()
  })

  it('escreve o período', () => {
    expect(periodoParcial(2026, 3)).toBe('janeiro a março de 2026')
    expect(periodoParcial(2026, 1)).toBe('janeiro de 2026')
  })
})

describe('página de histórico', () => {
  const sp = estado(
    'SP',
    [
      { ano: 2024, coletas: 1000, porMil: 20 },
      { ano: 2025, coletas: 900, porMil: 18 },
    ],
    { ano: 2026, ateMes: 3, coletas: 90, coletasAnoAnterior: 100 },
  )
  const ma = {
    ...estado('MA', [
      { ano: 2024, coletas: 0, porMil: 0 },
      { ano: 2025, coletas: 0, porMil: 0 },
    ]),
    cobertura: 'incompleto',
    populacao: 9,
  } as EstatisticaUF

  it('resume o último ano do Brasil, a variação e o recorde', () => {
    const r = resumoNacional([{ ...sp, populacao: 50 }, ma])

    expect(r).toEqual({
      ano: 2025,
      coletas: 900,
      porMil: 15254.2,
      variacao: -10,
      recorde: { ano: 2024, coletas: 1000 },
    })
  })

  it('monta a tabela com o estado de maior taxa primeiro e marca o incompleto', () => {
    const { anos, linhas } = tabelaPorEstado([ma, { ...sp, porMil: 18 }])

    expect(anos).toEqual([2024, 2025])
    expect(linhas.map((l) => l.uf)).toEqual(['SP', 'MA'])
    expect(linhas[1].anos[0]).toEqual({ ano: 2024, porMil: 0, incompleto: true })
  })

  it('ordena o ano em andamento da maior alta para a maior queda', () => {
    const sc = estado('SC', [], { ano: 2026, ateMes: 3, coletas: 110, coletasAnoAnterior: 100 })

    expect(parciaisPorEstado([sp, sc, ma])).toEqual([
      { uf: 'SC', percentual: 10 },
      { uf: 'SP', percentual: -10 },
    ])
  })

  it('soma os indicadores dos estados', () => {
    const a = { ...sp, indicadores: { primeira_vez: 10, repeticao: 5 } }
    const b = { ...ma, indicadores: { primeira_vez: 1 } }

    expect(indicadoresNacionais([a, b])).toEqual({ primeira_vez: 11, repeticao: 5 })
  })
})
