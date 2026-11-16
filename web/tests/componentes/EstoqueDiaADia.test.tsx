import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EstoqueDiaADia } from '@/components/EstoqueDiaADia'
import type { DiaEstoque } from '@/lib/api/cliente'

const dias: DiaEstoque[] = ['2026-10-26', '2026-10-27', '2026-10-29', '2026-10-30', '2026-10-31'].map(
  (data, i) => ({
    data,
    estoque: { 'O-': i < 3 ? 'critico' : 'alerta', 'A+': 'estavel' },
  }),
)

describe('EstoqueDiaADia', () => {
  it('monta a tabela tipo por dia com o nível em cada célula', () => {
    render(<EstoqueDiaADia dias={dias} id="hemoes" />)

    const tabela = screen.getByRole('table', { name: 'Dia a dia' })
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Tipo',
      '26/10',
      '27/10',
      '29/10',
      '30/10',
      '31/10',
    ])
    expect(screen.getByRole('rowheader', { name: 'O-' }).parentElement).toHaveTextContent(
      'O-CríticoCríticoCríticoAlertaAlerta',
    )
    expect(tabela).toHaveTextContent('Sem dado')
  })

  it('não aparece com menos de cinco dias', () => {
    const { container } = render(<EstoqueDiaADia dias={dias.slice(0, 4)} id="hemoes" />)

    expect(container).toBeEmptyDOMElement()
  })
})
