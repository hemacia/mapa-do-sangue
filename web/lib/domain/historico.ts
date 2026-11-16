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

export interface ResumoNacional {
  ano: number
  coletas: number
  porMil: number
  variacao: number | null // contra o ano anterior, só quando os dois anos têm menos de 5 estados faltando
  recorde: { ano: number; coletas: number }
}

export function resumoNacional(estatisticas: EstatisticaUF[]): ResumoNacional | null {
  const barras = barrasDoBrasil(estatisticas).filter((b) => b.valor !== null)
  const ultima = barras.at(-1)
  if (!ultima || ultima.valor === null) return null
  const populacao = estatisticas.reduce((s, e) => s + e.populacao, 0)
  const anterior = barras.at(-2)
  const recorde = barras.reduce((a, b) => ((b.valor ?? 0) > (a.valor ?? 0) ? b : a))
  return {
    ano: ultima.ano,
    coletas: ultima.valor,
    porMil: Math.round((ultima.valor / populacao) * 10_000) / 10,
    variacao:
      anterior?.valor && !anterior.incompleto && !ultima.incompleto
        ? Math.round(((ultima.valor - anterior.valor) / anterior.valor) * 1000) / 10
        : null,
    recorde: { ano: recorde.ano, coletas: recorde.valor ?? 0 },
  }
}

export interface LinhaEstado {
  uf: string
  ultimo: number | null // taxa do último ano, para ordenar
  anos: { ano: number; porMil: number | null; incompleto: boolean }[]
}

// Uma linha por estado, da maior taxa no último ano para a menor; sem dado vai para o fim.
export function tabelaPorEstado(estatisticas: EstatisticaUF[]): { anos: number[]; linhas: LinhaEstado[] } {
  const anos = [...new Set(estatisticas.flatMap((e) => (e.serie ?? []).map((a) => a.ano)))].sort(
    (a, b) => a - b,
  )
  const linhas = estatisticas.map((e) => {
    const porAno = new Map((e.serie ?? []).map((a) => [a.ano, a]))
    return {
      uf: e.uf,
      ultimo: e.cobertura === 'completo' ? e.porMil : null,
      anos: anos.map((ano) => {
        const a = porAno.get(ano)
        const porMil = a?.porMil ?? null
        return { ano, porMil, incompleto: porMil !== null && porMil < 5 }
      }),
    }
  })
  linhas.sort((a, b) => (b.ultimo ?? -1) - (a.ultimo ?? -1))
  return { anos, linhas }
}

export interface ParcialEstado {
  uf: string
  percentual: number
}

// Variação do ano em andamento por estado, da maior alta para a maior queda.
export function parciaisPorEstado(estatisticas: EstatisticaUF[]): ParcialEstado[] {
  return estatisticas
    .flatMap((e) =>
      e.parcial
        ? [
            {
              uf: e.uf,
              percentual:
                Math.round(
                  ((e.parcial.coletas - e.parcial.coletasAnoAnterior) / e.parcial.coletasAnoAnterior) * 1000,
                ) / 10,
            },
          ]
        : [],
    )
    .sort((a, b) => b.percentual - a.percentual)
}

// Soma os indicadores dos estados (último ano) para o perfil do Brasil.
export function indicadoresNacionais(estatisticas: EstatisticaUF[]): Record<string, number> {
  const soma: Record<string, number> = {}
  for (const e of estatisticas) {
    for (const [nome, valor] of Object.entries(e.indicadores ?? {})) soma[nome] = (soma[nome] ?? 0) + valor
  }
  return soma
}
