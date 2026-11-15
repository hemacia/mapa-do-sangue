import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MapaBrasil } from '@/components/MapaBrasil'
import type { EstatisticaUF, EstoqueHemocentro } from '@/lib/api/cliente'

const HEMOCENTROS: Pick<EstoqueHemocentro, 'uf' | 'nivelGeral' | 'estoque'>[] = [
  {
    uf: 'MG',
    nivelGeral: 'critico',
    estoque: { 'A+': 'adequado', 'O-': 'critico', 'O+': 'critico' },
  },
  { uf: 'BA', nivelGeral: 'alerta', estoque: { 'O-': 'alerta' } },
]

const estatistica = (uf: string, porMil: number | null, cobertura: EstatisticaUF['cobertura']) =>
  ({ uf, ano: 2024, coletas: null, populacao: 1, porMil, cobertura }) as EstatisticaUF

const ESTATISTICAS = [
  estatistica('MG', 16.2, 'completo'),
  estatistica('PB', 26.9, 'completo'),
  estatistica('RJ', 0, 'incompleto'),
]

function renderizar() {
  return render(<MapaBrasil estatisticas={ESTATISTICAS} hemocentros={HEMOCENTROS} />)
}

describe('MapaBrasil', () => {
  it('tem um link para a página de cada um dos 27 estados, descrevendo coletas e estoque', () => {
    renderizar()

    const mapa = screen.getByRole('group', { name: 'Mapa do Brasil por estado' })
    expect(within(mapa).getAllByRole('link')).toHaveLength(27)
    expect(
      within(mapa).getByRole('link', {
        name: 'Minas Gerais: 16,2 coletas por mil habitantes; 2 de 8 tipos críticos hoje',
      }),
    ).toHaveAttribute('href', '/estado/mg')
    expect(
      within(mapa).getByRole('link', {
        name: 'Rio de Janeiro: envio incompleto à Anvisa; o hemocentro não publica o estoque',
      }),
    ).toHaveAttribute('href', '/estado/rj')
  })

  it('pinta cada estado pela faixa de coletas e guarda o nível de cada tipo nas outras camadas', () => {
    renderizar()

    const minas = screen.getByRole('link', { name: /^Minas Gerais:/ })
    expect(minas.style.getPropertyValue('--f0')).toBe('var(--faixa-2)')
    expect(minas.style.getPropertyValue('--f1')).toBe('var(--adequado)')
    expect(minas.style.getPropertyValue('--f8')).toBe('var(--critico)')
    expect(screen.getByRole('link', { name: /^Paraíba:/ }).style.getPropertyValue('--x0')).toBe('#ffffff')
    const rio = screen.getByRole('link', { name: /^Rio de Janeiro:/ })
    expect(rio.style.getPropertyValue('--f0')).toBe('url(#hachura-incompleto)')
    expect(rio.style.getPropertyValue('--f8')).toBe('url(#hachura-sem-estoque)')
  })

  it('mostra uma placa por estado que publica, do mais crítico para o menos', () => {
    renderizar()

    const placas = screen.getAllByRole('link', { name: /^Estoque de/ })
    // Cada placa aparece duas vezes: sobre o mapa e na lista do celular.
    expect(placas.map((placa) => placa.getAttribute('aria-label'))).toEqual([
      'Estoque de Minas Gerais: 2 de 8 tipos críticos hoje',
      'Estoque de Bahia: 0 de 8 tipos críticos hoje',
      'Estoque de Minas Gerais: 2 de 8 tipos críticos hoje',
      'Estoque de Bahia: 0 de 8 tipos críticos hoje',
    ])
    expect(placas[0]).toHaveTextContent('2 críticos')
    expect(placas[1]).toHaveTextContent('0 críticos')
  })

  it('começa nas doações por estado e oferece os 8 tipos', () => {
    renderizar()

    expect(screen.getByRole('radio', { name: 'Doações por estado' })).toBeChecked()
    expect(screen.getAllByRole('radio', { name: /^Estoque de hoje do tipo/ })).toHaveLength(8)
  })

  it('explica as faixas da Anvisa e os níveis de estoque na legenda', () => {
    renderizar()

    expect(screen.getByText('Coletas de sangue por mil habitantes, 2024')).toBeInTheDocument()
    expect(screen.getByText('até 12')).toBeInTheDocument()
    expect(screen.getByText('21 ou mais')).toBeInTheDocument()
    expect(screen.getByText('não publica o estoque')).toBeInTheDocument()
  })
})
