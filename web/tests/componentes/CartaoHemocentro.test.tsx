import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CartaoHemocentro } from '@/components/CartaoHemocentro'
import { GradeTipos } from '@/components/GradeTipos'
import type { EstoqueHemocentro } from '@/lib/api/cliente'

const HEMOMINAS: EstoqueHemocentro = {
  id: 'hemominas',
  nome: 'Hemominas',
  uf: 'MG',
  cidade: 'Belo Horizonte',
  nivelGeral: 'critico',
  estoque: { 'O-': 'critico', 'A+': 'critico', 'B+': 'adequado' },
  atualizadoNaFonte: '2026-11-10T12:35',
  coletadoEm: '2026-11-10T15:00:00Z',
  historico: { 'O-': { dias: 3, diasCriticos: 3 }, 'A+': { dias: 3, diasCriticos: 3 } },
}

describe('CartaoHemocentro', () => {
  it('mostra o nível de cada tipo e "Sem dado" para o que a fonte não publica', () => {
    render(<CartaoHemocentro hemocentro={HEMOMINAS} />)

    const grade = screen.getByRole('list')
    expect(within(grade).getByText('O-').parentElement).toHaveTextContent('Crítico')
    expect(within(grade).getByText('B+').parentElement).toHaveTextContent('Adequado')
    expect(within(grade).getByText('B-').parentElement).toHaveTextContent('Sem dado')
  })

  it('diz quantas bolsas faltam quando a fonte publica o número', () => {
    const bolsas = { 'O-': { bolsas: 25, minimo: 103 }, 'B+': { bolsas: 400, minimo: 127 } }
    render(<CartaoHemocentro hemocentro={{ ...HEMOMINAS, bolsas }} />)

    expect(screen.getByText(/Abaixo do mínimo:/).parentElement).toHaveTextContent(
      'Abaixo do mínimo: O- com 25 de 103 bolsas',
    )
  })

  it('não fala de bolsas quando a fonte só publica o nível', () => {
    render(<CartaoHemocentro hemocentro={HEMOMINAS} />)

    expect(screen.queryByText(/Abaixo do mínimo/)).not.toBeInTheDocument()
  })

  it('mostra bolsas e mínimo nos blocos grandes', () => {
    render(
      <GradeTipos
        estoque={{ 'O-': 'critico' }}
        bolsas={{ 'O-': { bolsas: 25, minimo: 103 } }}
        variante="grande"
      />,
    )

    expect(screen.getByText('O-').parentElement).toHaveTextContent('Crítico25 bolsasmínimo 103')
  })

  it('lista os tipos críticos e diz quando ficaram assim em todo o histórico', () => {
    render(<CartaoHemocentro hemocentro={HEMOMINAS} />)

    expect(screen.getByText(/Crítico:/).parentElement).toHaveTextContent(
      'Crítico: A+ e O-, todos nos 3 dias de histórico',
    )
  })

  it('não fala do histórico quando algum tipo crítico teve dias normais', () => {
    const historico = { 'O-': { dias: 3, diasCriticos: 1 }, 'A+': { dias: 3, diasCriticos: 3 } }
    render(<CartaoHemocentro hemocentro={{ ...HEMOMINAS, historico }} />)

    expect(screen.getByText(/Crítico:/).parentElement).toHaveTextContent(/^Crítico: A\+ e O-$/)
  })

  it('mostra a data da fonte ou avisa que ela não informa', () => {
    const { rerender } = render(<CartaoHemocentro hemocentro={HEMOMINAS} />)
    expect(screen.getByText(/Atualizado pela fonte/)).toHaveTextContent('10/11/2026 às 12:35')

    rerender(<CartaoHemocentro hemocentro={{ ...HEMOMINAS, atualizadoNaFonte: null }} />)
    expect(screen.getByText('A fonte não informa quando atualizou')).toBeInTheDocument()
  })

  it('avisa quando nenhum tipo está crítico', () => {
    render(<CartaoHemocentro hemocentro={{ ...HEMOMINAS, estoque: { 'O-': 'estavel' }, historico: {} }} />)

    expect(screen.getByText('Nenhum tipo crítico hoje')).toBeInTheDocument()
  })

  it('leva para a página do estado, a menos que já esteja nela', () => {
    const { rerender } = render(<CartaoHemocentro hemocentro={HEMOMINAS} />)
    expect(screen.getByRole('link', { name: 'MG' })).toHaveAttribute('href', '/estado/mg')

    rerender(<CartaoHemocentro hemocentro={HEMOMINAS} comLinkDoEstado={false} />)
    expect(screen.queryByRole('link', { name: 'MG' })).not.toBeInTheDocument()
  })
})

describe('GradeTipos', () => {
  it('escreve o nível visível na variante grande', () => {
    render(<GradeTipos estoque={{ 'O-': 'critico' }} variante="grande" />)

    expect(screen.getByRole('list')).toHaveClass('tipos-grandes')
    expect(screen.getByText('Crítico')).not.toHaveClass('visualmente-oculto')
  })
})
