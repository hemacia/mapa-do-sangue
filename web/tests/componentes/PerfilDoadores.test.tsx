import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PerfilDoadores } from '@/components/PerfilDoadores'
import type { EstatisticaUF } from '@/lib/api/cliente'

const PB: EstatisticaUF = {
  uf: 'PB',
  ano: 2025,
  coletas: 48391,
  populacao: 4164468,
  porMil: 11.6,
  cobertura: 'completo',
  serie: [
    { ano: 2024, coletas: 111392, porMil: 26.9 },
    { ano: 2025, coletas: 48391, porMil: 11.6 },
  ],
  indicadores: { primeira_vez: 300, repeticao: 700, 'tipo_O+': 500, 'tipo_A+': 500 },
}

describe('PerfilDoadores', () => {
  it('mostra os doadores do ano, a variação e os percentuais', () => {
    render(<PerfilDoadores uf="PB" estatistica={PB} />)

    expect(screen.getByRole('heading', { name: 'Quem doa na Paraíba' })).toBeInTheDocument()
    expect(
      screen.getByText(/1\.000 doadores aptos em 2025.*caíram 56,6% de 2024 para 2025/),
    ).toBeInTheDocument()
    expect(screen.getByText('doaram pela primeira vez').nextSibling).toHaveTextContent('30%')
    expect(screen.getByText('O+').parentElement).toHaveTextContent('50%')
  })

  it('não aparece quando o estado não mandou o perfil', () => {
    const { container } = render(
      <PerfilDoadores uf="MA" estatistica={{ ...PB, uf: 'MA', indicadores: {} }} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
