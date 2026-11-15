import { cacheLife } from 'next/cache'
import { criarCliente } from './cliente'

// No servidor a API é chamada pela rede interna; o navegador usa NEXT_PUBLIC_API_URL.
const api = criarCliente(process.env.API_URL ?? 'http://localhost:8080')

// A coleta roda duas vezes por dia: um minuto de cache já poupa a API sem atrasar nada.
export async function estoqueAtual() {
  'use cache'
  cacheLife('minutes')
  return api.estoque()
}

export async function estatisticasPorUF() {
  'use cache'
  cacheLife('hours')
  return api.estatisticas()
}

// O CNES muda pouco e só com uma migration nova.
export async function pontosColeta(uf: string) {
  'use cache'
  cacheLife('days')
  return api.pontosColeta(uf)
}
