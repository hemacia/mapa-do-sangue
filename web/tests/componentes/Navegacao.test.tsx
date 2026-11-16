import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Navegacao } from '@/components/Navegacao'

const rota = vi.hoisted(() => ({ atual: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => rota.atual }))

describe('Navegacao', () => {
  it.each([
    ['/', 'Estoque'],
    ['/estado/mg', 'Estoque'],
    ['/hemocentros', 'Hemocentros'],
    ['/posso-doar', 'Posso doar?'],
    ['/sobre', 'Sobre os dados'],
  ])('em %s marca "%s" como a página atual', (caminho, rotulo) => {
    rota.atual = caminho
    render(<Navegacao />)

    expect(screen.getByRole('link', { current: 'page' })).toHaveTextContent(rotulo)
  })
})
