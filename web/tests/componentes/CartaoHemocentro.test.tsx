import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CartaoHemocentro } from '@/components/CartaoHemocentro'
import type { EstoqueHemocentro } from '@/lib/api/cliente'

const HEMOMINAS: EstoqueHemocentro = {
  id: 'hemominas',
  nome: 'Hemominas',
  uf: 'MG',
  cidade: 'Belo Horizonte',
  nivelGeral: 'critico',
  estoque: { 'O-': 'critico', 'A+': 'adequado' },
  atualizadoNaFonte: '2026-11-10T12:35',
  coletadoEm: '2026-11-10T15:00:00Z',
  historico: { 'O-': { dias: 10, diasCriticos: 7 }, 'A+': { dias: 1, diasCriticos: 0 } },
}

describe('CartaoHemocentro', () => {
  it('mostra o nível de cada tipo e "Sem dado" para o que a fonte não publica', () => {
    render(<CartaoHemocentro hemocentro={HEMOMINAS} />)

    const grade = screen.getByRole('list')
    expect(within(grade).getByText('O-').parentElement).toHaveTextContent('Crítico')
    expect(within(grade).getByText('A+').parentElement).toHaveTextContent('Adequado')
    expect(within(grade).getByText('B+').parentElement).toHaveTextContent('Sem dado')
  })

  it('mostra a data da fonte e os dias críticos do mês', () => {
    render(<CartaoHemocentro hemocentro={HEMOMINAS} />)

    expect(screen.getByText(/Atualizado pela fonte/)).toHaveTextContent('10/11/2026 às 12:35')
    expect(screen.getByText(/Atualizado pela fonte/)).toHaveTextContent('O- em 7 de 10 dias')
  })

  it('leva para a página do estado, a menos que já esteja nela', () => {
    const { rerender } = render(<CartaoHemocentro hemocentro={HEMOMINAS} />)
    expect(screen.getByRole('link', { name: 'MG' })).toHaveAttribute('href', '/estado/mg')

    rerender(<CartaoHemocentro hemocentro={HEMOMINAS} comLinkDoEstado={false} />)
    expect(screen.queryByRole('link', { name: 'MG' })).not.toBeInTheDocument()
  })
})
