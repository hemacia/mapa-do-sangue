'use client'

import { useEffect, useRef } from 'react'

function sobrepoe(a: DOMRect, b: DOMRect) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

// As placas têm tamanho fixo e o mapa muda de escala: a sigla que ficar embaixo de uma placa some.
// Sem JavaScript as siglas continuam visíveis, só que parcialmente cobertas.
export function EsconderSiglasCobertas() {
  const marcador = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const area = marcador.current?.parentElement
    if (!area) return
    function conferir() {
      const placas = [...(area?.querySelectorAll<HTMLElement>('.placas .placa') ?? [])]
        .filter((placa) => placa.offsetParent !== null)
        .map((placa) => placa.getBoundingClientRect())
      for (const sigla of area?.querySelectorAll('svg text') ?? []) {
        sigla.classList.remove('coberta')
        const caixa = sigla.getBoundingClientRect()
        sigla.classList.toggle(
          'coberta',
          placas.some((placa) => sobrepoe(caixa, placa)),
        )
      }
    }
    conferir()
    if (typeof ResizeObserver === 'undefined') return
    const observador = new ResizeObserver(conferir)
    observador.observe(area)
    return () => observador.disconnect()
  }, [])

  return <span ref={marcador} hidden />
}
