import type { TipoSanguineo } from '../domain/tipos'

// Parâmetro: data inicial (AAAA-MM-DD). Conta dias distintos, não coletas:
// a coleta roda duas vezes por dia.
export const CONSULTA_HISTORICO = `
  SELECT hemocentro_id, tipo,
         count(DISTINCT substr(coletado_em, 1, 10)) AS dias,
         count(DISTINCT CASE WHEN nivel = 'critico' THEN substr(coletado_em, 1, 10) END) AS dias_criticos
  FROM leituras_estoque
  WHERE coletado_em >= ?
  GROUP BY hemocentro_id, tipo
  ORDER BY hemocentro_id, tipo`

export interface LinhaHistorico {
  hemocentro_id: string
  tipo: TipoSanguineo
  dias: number
  dias_criticos: number
}

export type Historico = Partial<Record<TipoSanguineo, { dias: number; diasCriticos: number }>>

export function anexarHistorico<T extends { id: string }>(
  hemocentros: T[],
  linhas: LinhaHistorico[],
): (T & { historico: Historico })[] {
  return hemocentros.map((hemocentro) => {
    const historico: Historico = {}
    for (const linha of linhas.filter((l) => l.hemocentro_id === hemocentro.id)) {
      historico[linha.tipo] = { dias: linha.dias, diasCriticos: linha.dias_criticos }
    }
    return { ...hemocentro, historico }
  })
}
