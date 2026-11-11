import { load } from 'cheerio'
import { normalizarNivel } from '../../domain/nivel'
import { normalizarTipo } from '../../domain/tipos'
import { type Leitura, type ResultadoColeta, validarLeituras } from '../leituras'

// Página em ISO-8859-1: quem baixa precisa decodificar como latin1.
export const URL_HEMOSC = 'https://www.hemosc.org.br/'

// Escala do Hemosc, da melhor para a pior: Adequado, Estável, Reduzido, Alerta.
const ESCALA_HEMOSC = { alerta: 'critico' } as const

export function lerHemosc(html: string): ResultadoColeta {
  const $ = load(html)
  const leituras: Leitura[] = []
  for (const imagem of $('.tudo_home_estq img[alt]').toArray()) {
    const tipo = normalizarTipo($(imagem).attr('alt') ?? '')
    // O title é "Estável - Continue doando...": o nível vem antes do traço.
    const nivel = normalizarNivel(($(imagem).attr('title') ?? '').split(' - ')[0], ESCALA_HEMOSC)
    // A página repete o bloco inteiro (versões para celular e desktop).
    if (tipo && nivel && !leituras.some((leitura) => leitura.tipo === tipo)) {
      leituras.push({ tipo, nivel })
    }
  }
  return { leituras: validarLeituras('Hemosc', leituras), atualizadoNaFonte: null }
}
