import type { NivelEstoque } from '../domain/nivel'
import type { TipoSanguineo } from '../domain/tipos'

export interface Leitura {
  tipo: TipoSanguineo
  nivel: NivelEstoque
}

export interface ResultadoColeta {
  leituras: Leitura[]
  // Data (AAAA-MM-DD) ou data e hora local (AAAA-MM-DDTHH:MM) informada pela própria fonte.
  atualizadoNaFonte: string | null
}

// Página que mudou de layout costuma devolver lista vazia em vez de dar erro:
// melhor falhar alto do que gravar um estoque inventado.
export function validarLeituras(fonte: string, leituras: Leitura[]): Leitura[] {
  if (leituras.length === 0) throw new Error(`${fonte}: nenhuma leitura encontrada`)
  const vistos = new Set<TipoSanguineo>()
  for (const { tipo } of leituras) {
    if (vistos.has(tipo)) throw new Error(`${fonte}: tipo ${tipo} repetido`)
    vistos.add(tipo)
  }
  return leituras
}
