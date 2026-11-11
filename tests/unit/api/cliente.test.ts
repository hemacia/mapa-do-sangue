import { describe, expect, it, vi } from 'vitest'
import { buscarEstoque, buscarTotalDoMes, registrarDoacao } from '../../../src/api/cliente'

function respostaJson(corpo: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(corpo), { status }))
}

describe('cliente da API', () => {
  it('busca o estoque atual', async () => {
    const fetchFalso = respostaJson([{ id: 'hemoes' }])

    const estoque = await buscarEstoque(fetchFalso)

    expect(fetchFalso).toHaveBeenCalledWith('/api/estoque')
    expect(estoque).toEqual([{ id: 'hemoes' }])
  })

  it('falha com mensagem clara quando a API está fora do ar', async () => {
    await expect(buscarEstoque(respostaJson({}, 503))).rejects.toThrow('Não foi possível carregar o estoque')
  })

  it('envia a doação como JSON', async () => {
    const fetchFalso = respostaJson({ uf: 'MG', tipo: 'O-', data: '2026-11-10' }, 201)

    await registrarDoacao('MG', 'O-', fetchFalso)

    expect(fetchFalso).toHaveBeenCalledWith('/api/doacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uf: 'MG', tipo: 'O-' }),
    })
  })

  it('repassa o erro de validação devolvido pela API', async () => {
    await expect(registrarDoacao('MG', null, respostaJson({ erro: 'UF inválida' }, 400))).rejects.toThrow('UF inválida')
  })

  it('busca o total de doações do mês', async () => {
    expect(await buscarTotalDoMes(respostaJson({ mes: '2026-11', total: 12 }))).toBe(12)
  })
})
