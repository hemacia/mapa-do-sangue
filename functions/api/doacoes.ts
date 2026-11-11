import { CONTAR_DOACOES_DO_MES, INSERIR_DOACAO, validarDoacao } from '../../src/api/doacoes'
import { dataEmBrasilia, formatarData } from '../../src/domain/datas'
import type { Contexto } from './d1'

function mesAtual() {
  return formatarData(dataEmBrasilia(new Date())).slice(0, 7)
}

export async function onRequestGet({ env }: Contexto) {
  const linha = await env.DB.prepare(CONTAR_DOACOES_DO_MES).bind(mesAtual()).first<{ total: number }>()
  return Response.json({ mes: mesAtual(), total: linha?.total ?? 0 })
}

// shortcut: sem limite por IP; adicionar Rate Limiting do Cloudflare se aparecer abuso.
export async function onRequestPost({ env, request }: Contexto) {
  let doacao
  try {
    doacao = validarDoacao(await request.json(), dataEmBrasilia(new Date()))
  } catch (erro) {
    return Response.json({ erro: erro instanceof Error ? erro.message : 'Corpo inválido' }, { status: 400 })
  }
  await env.DB.prepare(INSERIR_DOACAO).bind(doacao.uf, doacao.tipo, doacao.data).run()
  return Response.json(doacao, { status: 201 })
}
