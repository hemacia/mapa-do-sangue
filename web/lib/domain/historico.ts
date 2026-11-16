import type { AnoColetas, EstatisticaUF } from '@/lib/api/cliente'
import { MINIMO_OMS_POR_MIL } from './brasil'

export interface Barra {
  ano: number
  valor: number | null // null = sem dado nesse ano
  incompleto: boolean
  faltando?: number // Brasil: estados sem envio completo naquele ano
}

// Com 5 ou mais estados faltando, o total do Brasil fica bem abaixo do real.
export const ESTADOS_FALTANDO_PARA_INCOMPLETO = 5

// Taxa por mil do estado ano a ano. Abaixo de 5 por mil o envio à Anvisa ficou incompleto.
export function barrasDoEstado(serie: AnoColetas[] | undefined): Barra[] {
  return (serie ?? []).map((a) => ({
    ano: a.ano,
    valor: a.porMil,
    incompleto: a.porMil !== null && a.porMil < 5,
  }))
}

// Coletas do Brasil por ano, somando os estados. Quase todo ano algum estado pequeno falta
// (sem envio ou abaixo de 5 por mil); só com 5 ou mais faltando o ano fica marcado como incompleto.
export function barrasDoBrasil(estatisticas: EstatisticaUF[]): Barra[] {
  const porAno = new Map<number, { soma: number; faltando: number }>()
  for (const e of estatisticas) {
    for (const a of e.serie ?? []) {
      const atual = porAno.get(a.ano) ?? { soma: 0, faltando: 0 }
      atual.soma += a.coletas ?? 0
      if (a.porMil === null || a.porMil < 5) atual.faltando++
      porAno.set(a.ano, atual)
    }
  }
  return [...porAno]
    .sort(([a], [b]) => a - b)
    .map(([ano, { soma, faltando }]) => ({
      ano,
      valor: soma,
      incompleto: faltando >= ESTADOS_FALTANDO_PARA_INCOMPLETO,
      faltando,
    }))
}

export interface ParcialNacional {
  ano: number
  ateMes: number
  percentual: number
  estados: number
}

// Soma os comparativos dos estados (mesmas unidades nos dois anos).
export function parcialNacional(estatisticas: EstatisticaUF[]): ParcialNacional | null {
  const parciais = estatisticas.flatMap((e) => (e.parcial ? [e.parcial] : []))
  if (parciais.length === 0) return null
  const atual = parciais.reduce((s, p) => s + p.coletas, 0)
  const anterior = parciais.reduce((s, p) => s + p.coletasAnoAnterior, 0)
  return {
    ano: parciais[0].ano,
    ateMes: Math.min(...parciais.map((p) => p.ateMes)),
    percentual: Math.round(((atual - anterior) / anterior) * 1000) / 10,
    estados: parciais.length,
  }
}

export const REFERENCIA_OMS = MINIMO_OMS_POR_MIL

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

export function periodoParcial(ano: number, ateMes: number) {
  return ateMes === 1 ? `janeiro de ${ano}` : `janeiro a ${MESES[ateMes - 1]} de ${ano}`
}
