import { type NivelEstoque, nivelMaisGrave } from './nivel'
import type { TipoSanguineo } from './tipos'
import { type UF, UFS } from './ufs'

interface ComNivel {
  uf: string
  nivelGeral: NivelEstoque
  estoque?: Partial<Record<TipoSanguineo, NivelEstoque>>
}

// Sem tipo, vale o nível geral (o pior tipo). null = o estado não publica (cinza no mapa).
export function nivelPorUF(hemocentros: ComNivel[], tipo?: TipoSanguineo): Record<UF, NivelEstoque | null> {
  const nivelDe = (h: ComNivel) => (tipo ? h.estoque?.[tipo] : h.nivelGeral)
  return Object.fromEntries(
    UFS.map((uf) => [
      uf,
      nivelMaisGrave(
        hemocentros.flatMap((h) => (h.uf === uf && nivelDe(h) ? [nivelDe(h) as NivelEstoque] : [])),
      ),
    ]),
  ) as Record<UF, NivelEstoque | null>
}
