import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EsconderSiglasCobertas } from '@/components/EsconderSiglasCobertas'

const caixa = (left: number, top: number, largura: number, altura: number) =>
  ({ left, top, right: left + largura, bottom: top + altura }) as DOMRect

// Posição de cada elemento na tela, já que o jsdom não calcula layout.
const CAIXAS: Record<string, DOMRect> = {
  MT: caixa(100, 100, 20, 12),
  AM: caixa(10, 10, 20, 12),
  BA: caixa(90, 95, 200, 30),
}

afterEach(() => vi.restoreAllMocks())

describe('EsconderSiglasCobertas', () => {
  it('esconde só a sigla que fica embaixo de uma placa visível', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return CAIXAS[this.textContent ?? ''] ?? caixa(0, 0, 0, 0)
    })
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body)

    const { container } = render(
      <div>
        <svg aria-hidden="true">
          <text>MT</text>
          <text>AM</text>
        </svg>
        <EsconderSiglasCobertas />
        <ul className="placas">
          <li>
            <a className="placa" href="/estado/ba">
              BA
            </a>
          </li>
        </ul>
      </div>,
    )

    const [mt, am] = container.querySelectorAll('text')
    expect(mt).toHaveClass('coberta')
    expect(am).not.toHaveClass('coberta')
  })
})
