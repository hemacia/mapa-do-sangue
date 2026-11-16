'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', rotulo: 'Estoque', ativo: (rota: string) => rota === '/' || rota.startsWith('/estado/') },
  { href: '/hemocentros', rotulo: 'Hemocentros', ativo: (rota: string) => rota === '/hemocentros' },
  { href: '/posso-doar', rotulo: 'Posso doar?', ativo: (rota: string) => rota === '/posso-doar' },
  { href: '/sobre', rotulo: 'Sobre os dados', ativo: (rota: string) => rota === '/sobre' },
]

export function Navegacao() {
  const rota = usePathname()
  return (
    <nav className="navegacao" aria-label="Principal">
      {LINKS.map(({ href, rotulo, ativo }) => (
        <Link key={href} href={href} aria-current={ativo(rota) ? 'page' : undefined}>
          {rotulo}
        </Link>
      ))}
    </nav>
  )
}
