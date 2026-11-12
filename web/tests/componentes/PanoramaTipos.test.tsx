import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PanoramaTipos } from '@/components/PanoramaTipos'

describe('PanoramaTipos', () => {
  it('mostra quantos hemocentros estão críticos em cada tipo', () => {
    render(
      <PanoramaTipos
        panorama={[
          { tipo: 'O-', criticos: 5, informados: 5, preenchimento: 0 },
          { tipo: 'A+', criticos: 1, informados: 5, preenchimento: 0.8 },
          { tipo: 'B-', criticos: 0, informados: 0, preenchimento: null },
        ]}
      />,
    )

    const linhas = screen.getAllByRole('listitem')
    expect(linhas[0]).toHaveTextContent('5 de 5 críticos')
    expect(linhas[0]).toHaveClass('nivel-critico')
    expect(linhas[1]).toHaveTextContent('1 de 5 crítico')
    expect(linhas[1]).toHaveClass('nivel-adequado')
    expect(linhas[2]).toHaveTextContent('sem dado')
    expect(linhas[2]).toHaveClass('nivel-sem-dado')
  })
})
