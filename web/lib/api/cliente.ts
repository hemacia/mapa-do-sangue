import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

export type EstoqueHemocentro = components['schemas']['EstoqueHemocentro']
export type EstatisticaUF = components['schemas']['EstatisticaUF']
export type NovaDoacao = components['schemas']['NovaDoacao']
export type Doacao = components['schemas']['Doacao']
export type TotalDoMes = components['schemas']['TotalDoMes']
export type PontoColeta = components['schemas']['PontoColeta']
export type AnoColetas = components['schemas']['AnoColetas']
export type AlertaNoticiado = components['schemas']['AlertaNoticiado']

type Problema = components['schemas']['Problema']

// Os tipos vêm do api/openapi.yaml (npm run gerar:api): se a API mudar o contrato, o build quebra.
export function criarCliente(baseUrl: string, fetch?: (req: Request) => Promise<Response>) {
  const api = createClient<paths>({ baseUrl, fetch })

  function resultado<T>(resposta: { data?: T; error?: unknown }): T {
    if (resposta.data === undefined) {
      const problema = resposta.error as Partial<Problema> | undefined
      throw new Error(problema?.title ?? 'API indisponível')
    }
    return resposta.data
  }

  return {
    estoque: async (uf?: string) => resultado(await api.GET('/v1/estoque', { params: { query: { uf } } })),
    estatisticas: async () => resultado(await api.GET('/v1/estatisticas')),
    pontosColeta: async (uf: string) =>
      resultado(await api.GET('/v1/pontos-coleta', { params: { query: { uf } } })),
    alertas: async (uf: string) => resultado(await api.GET('/v1/alertas', { params: { query: { uf } } })),
    totalDoMes: async () => resultado(await api.GET('/v1/doacoes/mes')),
    registrarDoacao: async (doacao: NovaDoacao) => resultado(await api.POST('/v1/doacoes', { body: doacao })),
  }
}
