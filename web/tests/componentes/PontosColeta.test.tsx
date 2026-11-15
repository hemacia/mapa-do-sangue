import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PontosColeta } from '@/components/PontosColeta'
import type { PontoColeta } from '@/lib/api/cliente'

function ponto(cnes: number, cidade: string, extra: Partial<PontoColeta> = {}): PontoColeta {
  return {
    cnes,
    nome: `Unidade ${cnes}`,
    uf: 'AM',
    cidade,
    latitude: -3.1,
    longitude: -60,
    publico: false,
    ...extra,
  }
}

describe('PontosColeta', () => {
  it('agrupa por cidade, com a de mais unidades primeiro', () => {
    render(<PontosColeta uf="AM" pontos={[ponto(1, 'Parintins'), ponto(2, 'Manaus'), ponto(3, 'Manaus')]} />)

    const cidades = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(cidades).toEqual(['Manaus', 'Parintins'])
    expect(screen.getByText(/3 unidades de hemoterapia em 2 cidades/)).toBeInTheDocument()
  })

  it('põe a capital antes mesmo com menos unidades', () => {
    render(<PontosColeta uf="AM" pontos={[ponto(1, 'Coari'), ponto(2, 'Coari'), ponto(3, 'Manaus')]} />)

    expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Manaus')
  })

  it('mostra cinco unidades por cidade e guarda o resto', () => {
    render(<PontosColeta uf="AM" pontos={[1, 2, 3, 4, 5, 6, 7].map((n) => ponto(n, 'Manaus'))} />)

    expect(screen.getByText('Mais 2 unidades em Manaus')).toBeInTheDocument()
  })

  it('mostra endereço, telefone clicável e a marca de unidade pública', () => {
    render(
      <PontosColeta
        uf="AM"
        pontos={[
          ponto(1, 'Manaus', {
            endereco: 'Av Constantino Nery, 4397',
            bairro: 'Chapada',
            telefone: '(92) 3655-0100',
            publico: true,
          }),
        ]}
      />,
    )

    const item = screen.getByRole('listitem')
    expect(item).toHaveTextContent('Av Constantino Nery, 4397, Chapada')
    expect(within(item).getByText('Público')).toBeInTheDocument()
    expect(within(item).getByRole('link', { name: '(92) 3655-0100' })).toHaveAttribute(
      'href',
      'tel:9236550100',
    )
  })

  it('guarda as cidades além das seis primeiras num bloco que abre', () => {
    const pontos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((c, i) => ponto(i, `Cidade ${c}`))
    const { container } = render(<PontosColeta uf="AM" pontos={pontos} />)

    expect(screen.getByText('Mais 2 cidades')).toBeInTheDocument()
    expect(container.querySelector('details')).not.toHaveAttribute('open')
  })

  it('não mostra nada sem unidades', () => {
    const { container } = render(<PontosColeta uf="AM" pontos={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
