'use client'

import { type ReactNode, useEffect, useRef } from 'react'

// Gruda a coluna enquanto a vizinha rola. Se ela for mais alta que a tela, gruda pela base
// (top negativo), para o fim do conteúdo também aparecer. Sem JavaScript, gruda no topo pelo CSS.
export function ColunaFixa({ children, className }: { children: ReactNode; className?: string }) {
  const coluna = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = coluna.current
    if (!el || typeof ResizeObserver === 'undefined') return
    function ajustar() {
      if (!el) return
      const barra = Number.parseFloat(getComputedStyle(el).getPropertyValue('--topbar-height')) || 0
      el.style.top = `${Math.min(barra, window.innerHeight - el.offsetHeight)}px`
    }
    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(el)
    window.addEventListener('resize', ajustar)
    return () => {
      observador.disconnect()
      window.removeEventListener('resize', ajustar)
    }
  }, [])

  return (
    <div ref={coluna} className={className}>
      {children}
    </div>
  )
}
