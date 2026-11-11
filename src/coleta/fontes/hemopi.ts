import { normalizarNivel } from '../../domain/nivel'
import { normalizarTipo } from '../../domain/tipos'
import { type Leitura, type ResultadoColeta, validarLeituras } from '../leituras'

// WordPress REST: um único post sobrescrito a cada atualização.
export const URL_HEMOPI = 'https://www.hemopi.pi.gov.br/wp-json/wp/v2/posicao-estoque'

interface ItemEstoque {
  _componente_sanguineo?: string
  _nivel_estoque?: string
}

export function lerHemopi(texto: string): ResultadoColeta {
  const post = JSON.parse(texto)?.[0]
  if (!post) throw new Error('Hemopi: endpoint não devolveu nenhum registro')

  const itens = Object.values<ItemEstoque>(post.registro_estoque ?? {})
  const leituras: Leitura[] = itens.flatMap((item) => {
    const componente = item._componente_sanguineo ?? ''
    // "Plaquetas A+" também tem tipo sanguíneo, mas aqui só entram hemácias.
    if (/plaqueta/i.test(componente)) return []
    const tipo = normalizarTipo(componente)
    const nivel = normalizarNivel(item._nivel_estoque ?? '')
    return tipo && nivel ? [{ tipo, nivel }] : []
  })

  return {
    leituras: validarLeituras('Hemopi', leituras),
    atualizadoNaFonte: typeof post.modified === 'string' ? post.modified.slice(0, 16) : null,
  }
}
