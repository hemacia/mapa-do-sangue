import { describe, expect, it } from 'vitest'
import type { EstatisticaUF } from '@/lib/api/cliente'
import { panoramaNacional } from '@/lib/domain/brasil'

const uf = (
  sigla: string,
  coletas: number | null,
  populacao: number,
  porMil: number | null,
  cobertura: EstatisticaUF['cobertura'],
) => ({ uf: sigla, ano: 2025, coletas, populacao, porMil, cobertura }) as EstatisticaUF

describe('panoramaNacional', () => {
  it('calcula as coletas por dia, o mínimo da OMS e os estados abaixo dele', () => {
    const p = panoramaNacional([
      uf('SP', 939_589, 46_081_801, 20.4, 'completo'),
      uf('RO', 8_271, 1_751_950, 4.7, 'incompleto'),
      uf('PB', 48_391, 4_164_468, 11.6, 'completo'),
      uf('AC', 5_067, 884_372, 5.7, 'completo'),
    ])

    expect(p).toEqual({
      ano: 2025,
      porDia: Math.round((939_589 + 8_271 + 48_391 + 5_067) / 365),
      minimoPorDia: Math.round(((46_081_801 + 1_751_950 + 4_164_468 + 884_372) * 10) / 1000 / 365),
      porMil: 18.9,
      abaixoDoMinimo: ['AC'],
    })
  })

  it('é nulo sem estatística', () => {
    expect(panoramaNacional([])).toBeNull()
    expect(panoramaNacional([uf('MA', null, 7_000_000, null, 'sem-dado')])).toBeNull()
  })
})
