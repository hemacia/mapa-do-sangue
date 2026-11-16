import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PainelEstado } from '@/components/PainelEstado'
import { montarResumos } from '@/lib/domain/resumo'

const resumos = montarResumos(
  [{ uf: 'MG', nivelGeral: 'critico', estoque: { 'O-': 'critico', 'A+': 'estavel' } }],
  [{ uf: 'MG', ano: 2025, coletas: 336030, populacao: 21393441, porMil: 15.7, cobertura: 'completo' }],
)

function montar() {
  render(
    <figure className="mapa">
      <a href="/estado/mg">Minas Gerais</a>
      <a href="/estado/am">Amazonas</a>
      <PainelEstado resumos={resumos} />
    </figure>,
  )
  return userEvent.setup()
}

describe('PainelEstado', () => {
  it('abre o resumo do estado clicado com o link para a página', async () => {
    const usuario = montar()

    await usuario.click(screen.getByText('Minas Gerais'))

    const painel = screen.getByRole('dialog', { name: 'Minas Gerais' })
    expect(painel).toHaveTextContent('1 de 8 tipos críticos hoje: O-')
    expect(painel).toHaveTextContent('coletas por mil habitantes em 202515,7')
    expect(screen.getByRole('link', { name: 'Ver mais sobre Minas Gerais' })).toHaveAttribute(
      'href',
      '/estado/mg',
    )
  })

  it('explica quando o estado não publica o estoque', async () => {
    const usuario = montar()

    await usuario.click(screen.getByText('Amazonas'))

    expect(screen.getByRole('dialog', { name: 'Amazonas' })).toHaveTextContent('não publicam o estoque')
  })

  it('fecha pelo botão', async () => {
    const usuario = montar()
    await usuario.click(screen.getByText('Minas Gerais'))

    await usuario.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deixa o "Ver mais" navegar', async () => {
    const usuario = montar()
    await usuario.click(screen.getByText('Minas Gerais'))
    let bloqueado = true
    document.addEventListener('click', (e) => {
      bloqueado = e.defaultPrevented
      e.preventDefault() // o jsdom não navega; só importa se o painel bloqueou antes
    })

    await usuario.click(screen.getByRole('link', { name: 'Ver mais sobre Minas Gerais' }))

    expect(bloqueado).toBe(false)
  })
})
