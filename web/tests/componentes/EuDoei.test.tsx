import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EuDoei } from '@/components/EuDoei'
import type { NovaDoacao } from '@/lib/api/cliente'

function montar(
  registrar = vi.fn(async (d: NovaDoacao) => ({ ...d, tipo: d.tipo ?? null, data: '2026-11-11' })),
  total = 41,
) {
  render(<EuDoei registrar={registrar} totalDoMes={async () => ({ mes: '2026-11', total })} />)
  return { registrar, usuario: userEvent.setup() }
}

describe('EuDoei', () => {
  it('mostra quantas doações foram registradas no mês', async () => {
    montar()

    expect(await screen.findByTestId('total-mes')).toHaveTextContent('41')
  })

  it('registra a doação com UF e tipo e soma no contador', async () => {
    const { registrar, usuario } = montar()
    await screen.findByTestId('total-mes')

    await usuario.selectOptions(screen.getByRole('combobox', { name: /^Estado/ }), 'MG')
    await usuario.selectOptions(screen.getByRole('combobox', { name: /^Tipo sanguíneo/ }), 'O-')
    await usuario.click(screen.getByRole('button', { name: 'Registrar minha doação' }))

    expect(registrar).toHaveBeenCalledWith({ uf: 'MG', tipo: 'O-' })
    expect(await screen.findByRole('status')).toHaveTextContent('Obrigado')
    expect(screen.getByTestId('total-mes')).toHaveTextContent('42')
  })

  it('envia tipo nulo quando a pessoa prefere não dizer', async () => {
    const { registrar, usuario } = montar()

    await usuario.selectOptions(screen.getByRole('combobox', { name: /^Estado/ }), 'BA')
    await usuario.click(screen.getByRole('button', { name: 'Registrar minha doação' }))

    expect(registrar).toHaveBeenCalledWith({ uf: 'BA', tipo: null })
  })

  it('mostra o erro quando o registro falha', async () => {
    const { usuario } = montar(
      vi.fn(async () => {
        throw new Error('Muitas doações registradas')
      }),
    )

    await usuario.selectOptions(screen.getByRole('combobox', { name: /^Estado/ }), 'SP')
    await usuario.click(screen.getByRole('button', { name: 'Registrar minha doação' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas doações registradas')
  })

  it('esconde o contador quando a API não responde', async () => {
    render(
      <EuDoei
        registrar={vi.fn()}
        totalDoMes={async () => {
          throw new Error('fora do ar')
        }}
      />,
    )

    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByTestId('total-mes')).not.toBeInTheDocument()
  })
})
