import type { EstatisticaUF } from '@/lib/api/cliente'
import type { UF } from './ufs'

// OMS: pelo menos 10 doações por mil habitantes por ano para a necessidade básica de um país.
export const MINIMO_OMS_POR_MIL = 10

export interface PanoramaNacional {
  ano: number
  porDia: number
  minimoPorDia: number
  porMil: number
  abaixoDoMinimo: UF[] // só estados com envio completo à Anvisa
}

// Soma os estados com dado do ano mais recente. Null sem estatística.
export function panoramaNacional(estatisticas: EstatisticaUF[]): PanoramaNacional | null {
  const comDado = estatisticas.filter((e) => e.coletas !== null)
  if (comDado.length === 0) return null
  const coletas = comDado.reduce((soma, e) => soma + (e.coletas ?? 0), 0)
  const populacao = estatisticas.reduce((soma, e) => soma + e.populacao, 0)
  return {
    ano: estatisticas[0].ano,
    porDia: Math.round(coletas / 365),
    minimoPorDia: Math.round((populacao * MINIMO_OMS_POR_MIL) / 1000 / 365),
    porMil: Math.round((coletas / populacao) * 10_000) / 10,
    abaixoDoMinimo: estatisticas
      .filter((e) => e.cobertura === 'completo' && e.porMil !== null && e.porMil < MINIMO_OMS_POR_MIL)
      .map((e) => e.uf as UF)
      .sort(),
  }
}
