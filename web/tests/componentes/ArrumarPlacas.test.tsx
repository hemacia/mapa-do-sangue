import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ArrumarPlacas } from '@/components/ArrumarPlacas'

const caixa = (left: number, top: number, largura: number, altura: number) =>
  ({ left, top, right: left + largura, bottom: top + altura }) as DOMRect

// Posição de cada elemento na tela, já que o jsdom não calcula layout.
const CAIXAS: Record<string, DOMRect> = {
  MT: caixa(100, 100, 20, 12),
  AM: caixa(10, 10, 20, 12),
  BA: caixa(90, 95, 200, 30),
}

afterEach(() => vi.restoreAllMocks())

describe('ArrumarPlacas', () => {
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
        <ArrumarPlacas />
        <ul className="placas">
          <li>
            <a className="placa" data-uf="BA" href="/estado/ba">
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

  it('desce a placa que bate na de cima e leva junto a ponta da linha', () => {
    const POSICOES: Record<string, DOMRect> = {
      MG: caixa(0, 100, 200, 30),
      MS: caixa(20, 110, 200, 30),
      AREA: caixa(0, 0, 800, 800),
    }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const id = (this as HTMLElement).dataset?.uf ?? (this.classList.contains('area') ? 'AREA' : '')
      return POSICOES[id] ?? caixa(0, 0, 0, 0)
    })
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body)

    const { container } = render(
      <div className="area">
        <svg aria-hidden="true">
          <line data-uf="MS" data-ponta="1" data-y="20" y1="20" />
        </svg>
        <ArrumarPlacas />
        <ul className="placas">
          <li>
            <a className="placa" data-uf="MG" href="/estado/mg">
              MG
            </a>
          </li>
          <li>
            <a className="placa" data-uf="MS" href="/estado/ms">
              MS
            </a>
          </li>
        </ul>
      </div>,
    )

    const [mg, ms] = container.querySelectorAll<HTMLElement>('.placa')
    expect(mg.style.getPropertyValue('--afastamento')).toBe('0px')
    expect(ms.style.getPropertyValue('--afastamento')).toBe('24px') // 100 + 30 + 4 - 110
    expect(container.querySelector('line')).toHaveAttribute('y1', '23') // 20 + 24/800 * 100
  })
})
