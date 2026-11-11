import { CONSULTA_ESTOQUE_ATUAL, type LinhaEstoque, agruparPorHemocentro } from '../../src/api/estoque'
import type { Contexto } from './d1'

export async function onRequestGet({ env }: Contexto) {
  const { results } = await env.DB.prepare(CONSULTA_ESTOQUE_ATUAL).all<LinhaEstoque>()
  return Response.json(agruparPorHemocentro(results), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}
