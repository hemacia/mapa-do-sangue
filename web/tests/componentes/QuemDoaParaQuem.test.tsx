import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { QuemDoaParaQuem } from '@/components/QuemDoaParaQuem'

describe('QuemDoaParaQuem', () => {
  it('mostra para quem e de quem o tipo escolhido doa e recebe hemácias', async () => {
    const usuario = userEvent.setup()
    render(<QuemDoaParaQuem />)

    await usuario.selectOptions(screen.getByLabelText('Seu tipo sanguíneo'), 'A+')

    expect(screen.getByTestId('doa-para')).toHaveTextContent('A+, AB+')
    expect(screen.getByTestId('recebe-de')).toHaveTextContent('A+, A-, O+, O-')
  })

  it('começa com O-, que doa hemácias para todos os tipos', () => {
    render(<QuemDoaParaQuem />)

    expect(screen.getByTestId('doa-para').textContent?.split(', ')).toHaveLength(8)
  })
})

describe('QuemDoaParaQuem: tabela', () => {
  it('destaca a linha do tipo escolhido e marca as células compatíveis', async () => {
    const usuario = userEvent.setup()
    render(<QuemDoaParaQuem />)

    await usuario.selectOptions(screen.getByLabelText('Seu tipo sanguíneo'), 'AB+')

    const linha = screen.getByRole('rowheader', { name: 'AB+' }).closest('tr')
    expect(linha).toHaveClass('selecionado')
    expect(linha?.querySelectorAll('td.pode')).toHaveLength(1)
    expect(screen.getAllByText('pode doar')).toHaveLength(27)
  })
})
