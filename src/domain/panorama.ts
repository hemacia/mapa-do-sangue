import { NIVEIS_ESTOQUE, type NivelEstoque } from './nivel'
import { TIPOS_SANGUINEOS, type TipoSanguineo } from './tipos'

export interface PanoramaTipo {
  tipo: TipoSanguineo
  criticos: number
  informados: number
  // De 0 (todos críticos) a 1 (todos adequados): quanto a bolsa aparece cheia.
  preenchimento: number | null
}

interface ComEstoque {
  estoque: Partial<Record<TipoSanguineo, NivelEstoque>>
}

const PESO = Object.fromEntries(NIVEIS_ESTOQUE.map((nivel, i) => [nivel, i / (NIVEIS_ESTOQUE.length - 1)]))

export function panoramaPorTipo(hemocentros: ComEstoque[]): PanoramaTipo[] {
  return TIPOS_SANGUINEOS.map((tipo) => {
    const niveis = hemocentros.flatMap((h) => (h.estoque[tipo] ? [h.estoque[tipo]] : []))
    const soma = niveis.reduce((total, nivel) => total + PESO[nivel], 0)
    return {
      tipo,
      criticos: niveis.filter((nivel) => nivel === 'critico').length,
      informados: niveis.length,
      preenchimento: niveis.length ? soma / niveis.length : null,
    }
  })
}

export function tiposMaisEmFalta(panorama: PanoramaTipo[]): TipoSanguineo[] {
  const maximo = Math.max(...panorama.map((p) => p.criticos))
  if (maximo === 0) return []
  return panorama.filter((p) => p.criticos === maximo).map((p) => p.tipo)
}
