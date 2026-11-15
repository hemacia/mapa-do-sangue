import Link from 'next/link'
import { BotaoTema } from './BotaoTema'
import { Navegacao } from './Navegacao'

export function Topo() {
  return (
    <header className="topo">
      <Link href="/" className="marca">
        <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true">
          <path d="M9 0C9 0 0 9.6 0 14a9 9 0 0 0 18 0C18 9.6 9 0 9 0z" fill="currentColor" />
        </svg>
        Mapa do Sangue
      </Link>
      <Navegacao />
      <BotaoTema />
    </header>
  )
}
