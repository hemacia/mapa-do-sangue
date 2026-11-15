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

export function tiposCriticos(estoque: Partial<Record<TipoSanguineo, NivelEstoque>>): TipoSanguineo[] {
  return TIPOS_SANGUINEOS.filter((tipo) => estoque[tipo] === 'critico')
}

// "O-", "O- e O+", "A-, B- e O-"
export function juntarTipos(tipos: readonly string[]): string {
  if (tipos.length <= 1) return tipos.join('')
  return `${tipos.slice(0, -1).join(', ')} e ${tipos.at(-1)}`
}

export interface Manchete {
  tipos: TipoSanguineo[]
  titulo: string
  complemento: string | null
}

// A frase principal da página inicial: o tipo que mais falta e o segundo colocado.
export function montarManchete(panorama: PanoramaTipo[], hemocentros: number): Manchete {
  const tipos = tiposMaisEmFalta(panorama)
  if (tipos.length === 0) {
    return {
      tipos,
      titulo: `Nenhum tipo está crítico nos ${hemocentros} hemocentros que publicam`,
      complemento: null,
    }
  }
  const criticos = panorama.find((p) => p.tipo === tipos[0])?.criticos ?? 0
  const verbo = tipos.length === 1 ? 'está crítico' : 'estão críticos'
  const onde = criticos === hemocentros ? `nos ${hemocentros}` : `em ${criticos} dos ${hemocentros}`
  const resto = panorama.filter((p) => !tipos.includes(p.tipo) && p.criticos > 0)
  const segundo = Math.max(0, ...resto.map((p) => p.criticos))
  const seguintes = resto.filter((p) => p.criticos === segundo).map((p) => p.tipo)
  return {
    tipos,
    titulo: `${juntarTipos(tipos)} ${verbo} ${onde} hemocentros que publicam`,
    complemento:
      seguintes.length === 0
        ? null
        : `${juntarTipos(seguintes)} ${seguintes.length === 1 ? 'está crítico' : 'estão críticos'} em ${segundo} deles.`,
  }
}
