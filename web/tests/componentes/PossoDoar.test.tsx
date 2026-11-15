import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PossoDoar } from '@/components/PossoDoar'
import { parseData } from '@/lib/domain/datas'

const HOJE = parseData('2026-11-10')

async function preencher(campos: { nascimento: string; peso: string; ultimaDoacao?: string; sexo?: string }) {
  const usuario = userEvent.setup()
  render(<PossoDoar hoje={HOJE} />)
  await usuario.type(screen.getByLabelText('Data de nascimento'), campos.nascimento)
  await usuario.type(screen.getByLabelText('Peso (kg)'), campos.peso)
  if (campos.sexo) await usuario.selectOptions(screen.getByLabelText('Sexo'), campos.sexo)
  if (campos.ultimaDoacao)
    await usuario.type(screen.getByLabelText(/Data da última doação/), campos.ultimaDoacao)
  await usuario.click(screen.getByRole('button', { name: 'Verificar' }))
}

describe('PossoDoar', () => {
  it('mostra que um adulto saudável pode doar hoje', async () => {
    await preencher({ nascimento: '1995-05-20', peso: '70' })

    expect(screen.getByRole('status')).toHaveTextContent('Você pode doar hoje')
  })

  it('mostra a próxima data para quem doou há pouco', async () => {
    await preencher({ nascimento: '1995-05-20', peso: '70', ultimaDoacao: '2026-10-01' })

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Hoje você ainda não pode doar')
    expect(status).toHaveTextContent('01/01/2027')
  })

  it('usa o intervalo menor para homens', async () => {
    await preencher({ nascimento: '1995-05-20', peso: '70', ultimaDoacao: '2026-10-01', sexo: 'masculino' })

    expect(screen.getByRole('status')).toHaveTextContent('01/12/2026')
  })

  it('mostra erro quando falta a data de nascimento', async () => {
    const usuario = userEvent.setup()
    render(<PossoDoar hoje={HOJE} />)

    await usuario.type(screen.getByLabelText('Peso (kg)'), '70')
    await usuario.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Confira')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('PossoDoar: antes de verificar', () => {
  it('explica onde a resposta vai aparecer', () => {
    render(<PossoDoar hoje={HOJE} />)

    expect(screen.getByRole('heading', { name: 'A resposta aparece aqui' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
