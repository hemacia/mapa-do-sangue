import type { TipoSanguineo } from '../domain/tipos'
import type { EstoqueHemocentro } from './estoque'

type Fetch = typeof fetch

export async function buscarEstoque(fetchFn: Fetch = fetch): Promise<EstoqueHemocentro[]> {
  const resposta = await fetchFn('/api/estoque')
  if (!resposta.ok) throw new Error('Não foi possível carregar o estoque')
  return resposta.json()
}

export async function registrarDoacao(uf: string, tipo: TipoSanguineo | null, fetchFn: Fetch = fetch): Promise<void> {
  const resposta = await fetchFn('/api/doacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uf, tipo }),
  })
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}))
    throw new Error(corpo.erro ?? 'Não foi possível registrar a doação')
  }
}

export async function buscarTotalDoMes(fetchFn: Fetch = fetch): Promise<number> {
  const resposta = await fetchFn('/api/doacoes')
  if (!resposta.ok) throw new Error('Não foi possível carregar o total do mês')
  return (await resposta.json()).total
}
