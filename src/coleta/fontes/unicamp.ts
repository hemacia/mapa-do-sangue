import { load } from 'cheerio'
import { extrairDataBR } from '../../domain/datas'
import { normalizarNivel } from '../../domain/nivel'
import { normalizarTipo } from '../../domain/tipos'
import { type Leitura, type ResultadoColeta, validarLeituras } from '../leituras'

export const URL_UNICAMP = 'https://www.hemocentro.unicamp.br/'

// O nível só aparece no nome da imagem: critico.webp, Alerta.webp, Estavel-Ok.webp.
function nivelPelaImagem(src: string) {
  const arquivo = src.split('/').pop() ?? ''
  return normalizarNivel(arquivo.split(/[-.]/)[0])
}

export function lerUnicamp(html: string): ResultadoColeta {
  const $ = load(html)
  const leituras: Leitura[] = $('.box-card-wrapper')
    .toArray()
    .flatMap((cartao) => {
      // Os cartões da legenda ("Estável", "Alerta") não têm tipo e ficam de fora aqui.
      const tipo = normalizarTipo($(cartao).find('.card__small-text').text())
      const nivel = nivelPelaImagem($(cartao).find('img.card__small__icon-img').attr('src') ?? '')
      return tipo && nivel ? [{ tipo, nivel }] : []
    })

  const atualizacao = $('p')
    .toArray()
    .map((p) => $(p).text())
    .find((texto) => /última atualização/i.test(texto))

  return {
    leituras: validarLeituras('Unicamp', leituras),
    atualizadoNaFonte: atualizacao ? extrairDataBR(atualizacao) : null,
  }
}
