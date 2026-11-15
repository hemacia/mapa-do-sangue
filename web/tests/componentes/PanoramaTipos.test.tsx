import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PanoramaTipos } from '@/components/PanoramaTipos'

describe('PanoramaTipos', () => {
  it('mostra em quantos hemocentros cada tipo está crítico e destaca quem falta em todos', () => {
    render(
      <PanoramaTipos
        hemocentros={5}
        panorama={[
          { tipo: 'O-', criticos: 5, informados: 5, preenchimento: 0 },
          { tipo: 'A+', criticos: 1, informados: 5, preenchimento: 0.8 },
          { tipo: 'B+', criticos: 0, informados: 5, preenchimento: 1 },
          { tipo: 'B-', criticos: 0, informados: 0, preenchimento: null },
        ]}
      />,
    )

    const linhas = screen.getAllByRole('listitem')
    expect(linhas[0]).toHaveTextContent('5 de 5')
    expect(linhas[0]).toHaveClass('todos')
    expect(linhas[1]).toHaveTextContent('1 de 5')
    expect(linhas[1]).not.toHaveClass('todos')
    expect(linhas[2]).toHaveTextContent('nenhum')
    expect(linhas[3]).toHaveTextContent('sem dado')
    expect(screen.getByRole('heading', { name: 'Tipos em falta hoje' })).toBeInTheDocument()
  })
})
