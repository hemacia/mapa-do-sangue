import { describe, expect, it } from 'vitest'
import { criarCliente } from '@/lib/api/cliente'

function fetchFalso(status: number, corpo: unknown, chamadas: Request[] = []) {
  return async (req: Request) => {
    chamadas.push(req)
    return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
  }
}

describe('cliente da API', () => {
  it('busca o estoque de todos os hemocentros', async () => {
    const chamadas: Request[] = []
    const api = criarCliente('http://api.teste', fetchFalso(200, [{ id: 'hemominas' }], chamadas))

    const estoque = await api.estoque()

    expect(estoque).toEqual([{ id: 'hemominas' }])
    expect(chamadas[0].url).toBe('http://api.teste/v1/estoque')
  })

  it('busca os pontos de coleta do estado', async () => {
    const chamadas: Request[] = []
    const api = criarCliente('http://api.teste', fetchFalso(200, [{ cnes: 1 }], chamadas))

    expect(await api.pontosColeta('AM')).toEqual([{ cnes: 1 }])
    expect(chamadas[0].url).toBe('http://api.teste/v1/pontos-coleta?uf=AM')
  })

  it('busca os alertas noticiados do estado', async () => {
    const chamadas: Request[] = []
    const api = criarCliente('http://api.teste', fetchFalso(200, [], chamadas))

    await api.alertas('GO')

    expect(chamadas[0].url).toBe('http://api.teste/v1/alertas?uf=GO')
  })

  it('busca o estoque dia a dia de um hemocentro', async () => {
    const chamadas: Request[] = []
    const api = criarCliente('http://api.teste', fetchFalso(200, [], chamadas))

    await api.historico('hemoes')

    expect(chamadas[0].url).toBe('http://api.teste/v1/hemocentros/hemoes/historico')
  })

  it('filtra o estoque por UF', async () => {
    const chamadas: Request[] = []
    const api = criarCliente('http://api.teste', fetchFalso(200, [], chamadas))

    await api.estoque('MG')

    expect(chamadas[0].url).toBe('http://api.teste/v1/estoque?uf=MG')
  })

  it('falha com mensagem clara quando a API responde erro', async () => {
    const api = criarCliente(
      'http://api.teste',
      fetchFalso(503, { title: 'Banco indisponível', status: 503 }),
    )

    await expect(api.estatisticas()).rejects.toThrow('Banco indisponível')
  })

  it('registra uma doação e devolve o registro com a data do servidor', async () => {
    const chamadas: Request[] = []
    const registro = { uf: 'MG', tipo: 'O-', data: '2026-11-11' }
    const api = criarCliente('http://api.teste', fetchFalso(201, registro, chamadas))

    const doacao = await api.registrarDoacao({ uf: 'MG', tipo: 'O-' })

    expect(doacao).toEqual(registro)
    expect(chamadas[0].method).toBe('POST')
    expect(await chamadas[0].json()).toEqual({ uf: 'MG', tipo: 'O-' })
  })

  it('traz o total de doações do mês', async () => {
    const api = criarCliente('http://api.teste', fetchFalso(200, { mes: '2026-11', total: 7 }))

    const total = await api.totalDoMes()

    expect(total).toEqual({ mes: '2026-11', total: 7 })
  })
})
