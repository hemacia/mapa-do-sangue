import { type NivelEstoque, nivelMaisGrave } from './nivel'
import { type UF, UFS } from './ufs'

interface ComNivel {
  uf: string
  nivelGeral: NivelEstoque
}

// null = o estado não publica o estoque (aparece cinza no mapa).
export function nivelPorUF(hemocentros: ComNivel[]): Record<UF, NivelEstoque | null> {
  return Object.fromEntries(
    UFS.map((uf) => [uf, nivelMaisGrave(hemocentros.filter((h) => h.uf === uf).map((h) => h.nivelGeral))]),
  ) as Record<UF, NivelEstoque | null>
}
