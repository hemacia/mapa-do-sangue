import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HistoricoBrasil, HistoricoEstado } from '@/components/Historico'
import type { EstatisticaUF } from '@/lib/api/cliente'

const MG = {
  uf: 'MG',
  ano: 2025,
  coletas: 336030,
  populacao: 21393441,
  porMil: 15.7,
  cobertura: 'completo',
  serie: [
    { ano: 2010, coletas: 274446, porMil: 14 },
    { ano: 2011, coletas: 9000, porMil: 0.5 },
    { ano: 2025, coletas: 336030, porMil: 15.7 },
  ],
  parcial: { ano: 2026, ateMes: 3, coletas: 1973, coletasAnoAnterior: 1865 },
} as EstatisticaUF

describe('HistoricoEstado', () => {
  it('lista cada ano com a taxa e marca o envio incompleto', () => {
    render(<HistoricoEstado uf="MG" estatistica={MG} />)

    expect(screen.getByRole('heading', { name: 'Coletas por ano em Minas Gerais' })).toBeInTheDocument()
    const anos = screen.getAllByRole('listitem').map((li) => li.getAttribute('title'))
    expect(anos).toEqual([
      '2010: 14 coletas por mil habitantes',
      '2011: 0,5 coletas por mil habitantes, envio incompleto',
      '2025: 15,7 coletas por mil habitantes',
    ])
    expect(screen.getByText(/envio incompleto à Anvisa naquele ano/)).toBeInTheDocument()
  })

  it('compara o ano em andamento com o mesmo período do anterior', () => {
    render(<HistoricoEstado uf="MG" estatistica={MG} />)

    expect(screen.getByText(/Em janeiro a março de 2026/)).toHaveTextContent(
      'coletaram +5,8% que no mesmo período de 2025',
    )
  })

  it('explica quando o ano em andamento ainda não tem mês publicado', () => {
    render(<HistoricoEstado uf="SP" estatistica={{ ...MG, uf: 'SP', parcial: undefined }} />)

    expect(screen.getByText(/ainda não publicou meses de 2026/)).toBeInTheDocument()
  })
})

describe('HistoricoBrasil', () => {
  it('soma o Brasil por ano e mostra o comparativo do ano em andamento', () => {
    render(<HistoricoBrasil estatisticas={[MG]} />)

    expect(
      screen.getByRole('heading', { name: 'Coletas de sangue no Brasil, 2010 a 2025' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText(/nas unidades de 1 estado que/)).toBeInTheDocument()
  })

  it('some sem série', () => {
    const { container } = render(<HistoricoBrasil estatisticas={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
