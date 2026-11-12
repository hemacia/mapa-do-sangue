'use client'

import { useEffect, useState } from 'react'

type Tema = 'light' | 'dark'

// Script que roda antes da página aparecer, para o tema salvo não piscar.
export const SCRIPT_TEMA = `try{var t=localStorage.getItem('tema');if(t)document.documentElement.dataset.theme=t}catch(e){}`

function temaAtual(): Tema {
  const salvo = document.documentElement.dataset.theme
  if (salvo === 'light' || salvo === 'dark') return salvo
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function BotaoTema() {
  const [tema, setTema] = useState<Tema | null>(null)
  useEffect(() => setTema(temaAtual()), [])

  function alternar() {
    const novo: Tema = temaAtual() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = novo
    try {
      localStorage.setItem('tema', novo)
    } catch {
      // navegação privada: o tema vale só nesta página
    }
    setTema(novo)
  }

  return (
    <button
      type="button"
      className="botao-tema"
      onClick={alternar}
      aria-label={tema === 'light' ? 'Usar tema escuro' : 'Usar tema claro'}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        {tema === 'light' ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
  )
}
