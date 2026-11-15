import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AlertaNoticiado } from '@/components/AlertaNoticiado'

describe('AlertaNoticiado', () => {
  it('mostra a notícia mais recente com data, link e o aviso de que não é leitura do estoque', () => {
    render(
      <AlertaNoticiado
        alertas={[
          {
            uf: 'GO',
            fonte: 'ses-go',
            titulo: 'Hemocentro alerta para estoques críticos de sangue',
            url: 'https://goias.gov.br/saude/hemocentro-alerta',
            publicadoEm: '2026-10-23T14:43:38Z',
          },
        ]}
      />,
    )

    expect(screen.getByText(/Alerta noticiado em 23\/10/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /estoques críticos/ })).toHaveAttribute(
      'href',
      'https://goias.gov.br/saude/hemocentro-alerta',
    )
    expect(screen.getByText(/não uma leitura do estoque/)).toBeInTheDocument()
  })

  it('não aparece sem alerta', () => {
    const { container } = render(<AlertaNoticiado alertas={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
