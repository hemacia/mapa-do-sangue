import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MapaDeCalor } from '@/components/MapaDeCalor'
import { ParcialEstados } from '@/components/ParcialEstados'

describe('MapaDeCalor', () => {
  it('mostra cada estado com a taxa de cada ano e liga para a página do estado', () => {
    render(
      <MapaDeCalor
        anos={[2024, 2025]}
        linhas={[
          {
            uf: 'MG',
            ultimo: 15.7,
            anos: [
              { ano: 2024, porMil: 16.2, incompleto: false },
              { ano: 2025, porMil: 15.7, incompleto: false },
            ],
          },
          {
            uf: 'MA',
            ultimo: null,
            anos: [
              { ano: 2024, porMil: 0, incompleto: true },
              { ano: 2025, porMil: null, incompleto: false },
            ],
          },
        ]}
      />,
    )

    const mg = screen.getByRole('rowheader', { name: 'Minas Gerais' }).parentElement as HTMLElement
    expect(
      within(mg)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['16,2', '15,7', '15,7'])
    expect(screen.getByRole('link', { name: 'Minas Gerais' })).toHaveAttribute('href', '/estado/mg')
    const ma = screen.getByRole('rowheader', { name: 'Maranhão' }).parentElement as HTMLElement
    expect(
      within(ma)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['0, envio incompleto', 'sem dado', '–'])
  })
})

describe('ParcialEstados', () => {
  it('desenha alta para a direita e queda para a esquerda, com o valor escrito', () => {
    const { container } = render(
      <ParcialEstados
        parciais={[
          { uf: 'DF', percentual: 29.9 },
          { uf: 'AC', percentual: -45.6 },
        ]}
      />,
    )

    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Distrito Federal+29,9%',
      'Acre-45,6%',
    ])
    // A escala corta em 40%: o Acre ocupa a metade inteira, sem passar dela.
    expect(container.querySelector('.parcial-queda')).toHaveStyle({ width: '50%' })
  })
})
