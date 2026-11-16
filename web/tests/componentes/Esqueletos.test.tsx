import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ColunaFixa } from '@/components/ColunaFixa'
import {
  EsqueletoEstado,
  EsqueletoInicio,
  EsqueletoPaginaHemocentros,
  EsqueletoPossoDoar,
  EsqueletoSobre,
} from '@/components/Esqueletos'

describe('Esqueletos', () => {
  it.each([
    ['início', EsqueletoInicio, 'Carregando o estoque', 'inicio'],
    ['estado', EsqueletoEstado, 'Carregando o estado', 'faixa-casco'],
    ['hemocentros', EsqueletoPaginaHemocentros, 'Carregando os hemocentros', 'hemocentros-grade'],
    ['posso doar', EsqueletoPossoDoar, 'Carregando o formulário', 'posso-doar'],
    ['sobre', EsqueletoSobre, 'Carregando a página', 'cabecalho'],
  ])('o de %s avisa o leitor de tela e usa a grade da própria página', (_, Esqueleto, aviso, classe) => {
    const { container } = render(<Esqueleto />)

    expect(screen.getByRole('status')).toHaveTextContent(aviso)
    expect(container.querySelector(`.${classe}`)).not.toBeNull()
  })
})

describe('ColunaFixa', () => {
  afterEach(() => vi.restoreAllMocks())

  it('gruda pela base quando a coluna é mais alta que a tela', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    )
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(1200)
    window.innerHeight = 900

    render(<ColunaFixa className="coluna">conteúdo</ColunaFixa>)

    expect(screen.getByText('conteúdo')).toHaveStyle({ top: '-300px' })
  })
})
