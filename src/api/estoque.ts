import { type NivelEstoque, nivelMaisGrave } from '../domain/nivel'
import type { TipoSanguineo } from '../domain/tipos'

export const CONSULTA_ESTOQUE_ATUAL = `
  SELECT h.id AS hemocentro_id, h.nome, h.uf, h.cidade, h.latitude, h.longitude,
         l.tipo, l.nivel, l.atualizado_na_fonte, l.coletado_em
  FROM leituras_estoque l
  JOIN hemocentros h ON h.id = l.hemocentro_id
  WHERE l.coletado_em = (
    SELECT max(coletado_em) FROM leituras_estoque WHERE hemocentro_id = l.hemocentro_id
  )
  ORDER BY h.uf, h.nome`

export interface LinhaEstoque {
  hemocentro_id: string
  nome: string
  uf: string
  cidade: string
  latitude: number | null
  longitude: number | null
  tipo: TipoSanguineo
  nivel: NivelEstoque
  atualizado_na_fonte: string | null
  coletado_em: string
}

export interface EstoqueHemocentro {
  id: string
  nome: string
  uf: string
  cidade: string
  latitude: number | null
  longitude: number | null
  nivelGeral: NivelEstoque
  estoque: Partial<Record<TipoSanguineo, NivelEstoque>>
  atualizadoNaFonte: string | null
  coletadoEm: string
}

export function agruparPorHemocentro(linhas: LinhaEstoque[]): EstoqueHemocentro[] {
  const porId = new Map<string, EstoqueHemocentro>()
  for (const linha of linhas) {
    const atual = porId.get(linha.hemocentro_id) ?? {
      id: linha.hemocentro_id,
      nome: linha.nome,
      uf: linha.uf,
      cidade: linha.cidade,
      latitude: linha.latitude,
      longitude: linha.longitude,
      nivelGeral: linha.nivel,
      estoque: {},
      atualizadoNaFonte: linha.atualizado_na_fonte,
      coletadoEm: linha.coletado_em,
    }
    atual.estoque[linha.tipo] = linha.nivel
    atual.nivelGeral = nivelMaisGrave([atual.nivelGeral, linha.nivel])!
    porId.set(linha.hemocentro_id, atual)
  }
  return [...porId.values()]
}
