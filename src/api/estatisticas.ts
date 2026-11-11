import { type Cobertura, classificarCobertura, taxaPorMil } from '../domain/estatisticas'

export const CONSULTA_ESTATISTICAS = `
  SELECT uf, ano, coletas, populacao FROM estatisticas_uf
  WHERE ano = (SELECT max(ano) FROM estatisticas_uf)`

export interface LinhaEstatistica {
  uf: string
  ano: number
  coletas: number | null
  populacao: number
}

export interface EstatisticaUF extends LinhaEstatistica {
  porMil: number | null
  cobertura: Cobertura
}

export function montarEstatisticas(linhas: LinhaEstatistica[]): EstatisticaUF[] {
  return linhas
    .map((linha) => {
      const porMil = linha.coletas === null ? null : taxaPorMil(linha.coletas, linha.populacao)
      return { ...linha, porMil, cobertura: classificarCobertura(porMil) }
    })
    .sort((a, b) => (b.porMil ?? -1) - (a.porMil ?? -1))
}
