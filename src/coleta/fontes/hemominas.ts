import { load } from 'cheerio'
import { extrairDataBR } from '../../domain/datas'
import { normalizarNivel } from '../../domain/nivel'
import { normalizarTipo } from '../../domain/tipos'
import { type Leitura, type ResultadoColeta, validarLeituras } from '../leituras'

export const URL_HEMOMINAS = 'https://www.hemominas.mg.gov.br/'

// Na legenda da Hemominas "Estável" é o melhor nível ("Aguarde 10 dias para agendar")
// e "Adequado" vem logo abaixo, o contrário da escala comum.
const ESCALA_HEMOMINAS = { estavel: 'adequado', adequado: 'estavel' } as const

export function lerHemominas(html: string): ResultadoColeta {
  const $ = load(html)
  const leituras: Leitura[] = $('.container-estoque-de-sangue-div-2 > div')
    .toArray()
    .flatMap((cartao) => {
      const tipo = normalizarTipo($(cartao).find('b').text())
      const nivel = normalizarNivel($(cartao).find('p').text(), ESCALA_HEMOMINAS)
      return tipo && nivel ? [{ tipo, nivel }] : []
    })

  return {
    leituras: validarLeituras('Hemominas', leituras),
    atualizadoNaFonte: extrairDataBR($('.container-estoque-de-sangue-data').text()),
  }
}
