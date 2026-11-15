import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiasCriticos } from '@/components/DiasCriticos'
import { MapaDestaque } from '@/components/MapaDestaque'

describe('DiasCriticos', () => {
  it('mostra quantos dias cada tipo ficou crítico no histórico', () => {
    render(
      <DiasCriticos historico={{ 'O-': { dias: 3, diasCriticos: 3 }, 'A+': { dias: 3, diasCriticos: 0 } }} />,
    )

    const linhas = screen.getAllByRole('listitem')
    expect(linhas).toHaveLength(8)
    expect(linhas[7]).toHaveTextContent('O-3 de 3 dias')
    expect(linhas[0]).toHaveTextContent('A+nenhum dia')
    expect(linhas[1]).toHaveTextContent('A-sem dado')
    expect(screen.getByText(/tem 3 dias/)).toBeInTheDocument()
  })

  it('avisa quando ainda não há histórico', () => {
    render(<DiasCriticos historico={{}} />)

    expect(screen.getByText('Ainda não há histórico guardado para este hemocentro.')).toBeInTheDocument()
  })
})

describe('MapaDestaque', () => {
  it('destaca o estado e marca os que publicam', () => {
    const { container } = render(<MapaDestaque uf="RJ" ufsQuePublicam={['MG', 'SP']} />)

    expect(
      screen.getByRole('img', { name: 'Rio de Janeiro destacado no mapa do Brasil' }),
    ).toBeInTheDocument()
    expect(container.querySelectorAll('path.publica')).toHaveLength(2)
    expect(container.querySelector('path.atual.sem-estoque')).not.toBeNull()
  })
})
