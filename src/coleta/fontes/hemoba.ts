import { load } from 'cheerio'
import { normalizarNivel } from '../../domain/nivel'
import { normalizarTipo } from '../../domain/tipos'
import { type Leitura, type ResultadoColeta, validarLeituras } from '../leituras'

export const URL_HEMOBA = 'https://www.ba.gov.br/hemoba/'

export function lerHemoba(html: string): ResultadoColeta {
  const $ = load(html)
  const leituras: Leitura[] = $('.bagov-card-item__content-mini')
    .toArray()
    .flatMap((cartao) => {
      const tipo = normalizarTipo($(cartao).find('.bagov-card-item__title').text())
      const nivel = normalizarNivel($(cartao).find('.bagov-card-item__description').text())
      return tipo && nivel ? [{ tipo, nivel }] : []
    })
  // A página não informa quando o estoque foi atualizado.
  return { leituras: validarLeituras('Hemoba', leituras), atualizadoNaFonte: null }
}
