'use client'

import { useEffect, useRef } from 'react'
import { afastarCaixas } from '@/lib/mapa/afastar'

function sobrepoe(a: DOMRect, b: DOMRect) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

// As placas têm tamanho fixo e o mapa muda de escala. Depois de cada mudança de tamanho:
// 1. a placa que bate em outra desce, e a ponta da linha até o estado desce junto;
// 2. a sigla que ficar embaixo de uma placa some.
// Sem JavaScript tudo continua visível, só que com placas e siglas se cobrindo.
export function ArrumarPlacas() {
  const marcador = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const area = marcador.current?.parentElement
    if (!area) return
    function arrumar() {
      if (!area) return
      const visiveis = [...area.querySelectorAll<HTMLElement>('.placas .placa[data-uf]')].filter(
        (placa) => placa.offsetParent !== null,
      )
      for (const placa of visiveis) placa.style.removeProperty('--afastamento')
      const deslocamentos = afastarCaixas(
        visiveis.map((placa) => {
          const { left, right, top, bottom } = placa.getBoundingClientRect()
          return { id: placa.dataset.uf ?? '', left, right, top, bottom }
        }),
      )
      const { top, bottom } = area.getBoundingClientRect()
      const altura = bottom - top
      for (const placa of visiveis) {
        const px = deslocamentos.get(placa.dataset.uf ?? '') ?? 0
        placa.style.setProperty('--afastamento', `${px}px`)
        for (const linha of area.querySelectorAll<SVGLineElement>(`line[data-uf="${placa.dataset.uf}"]`)) {
          const ponta = linha.getAttribute('data-ponta') === '2' ? 'y2' : 'y1'
          const base = Number(linha.getAttribute('data-y'))
          linha.setAttribute(ponta, String(altura > 0 ? base + (px / altura) * 100 : base))
        }
      }
      const caixas = visiveis.map((placa) => placa.getBoundingClientRect())
      for (const sigla of area.querySelectorAll('svg text')) {
        sigla.classList.remove('coberta')
        sigla.classList.toggle(
          'coberta',
          caixas.some((placa) => sobrepoe(sigla.getBoundingClientRect(), placa)),
        )
      }
    }
    arrumar()
    if (typeof ResizeObserver === 'undefined') return
    const observador = new ResizeObserver(arrumar)
    observador.observe(area)
    return () => observador.disconnect()
  }, [])

  return <span ref={marcador} hidden />
}
