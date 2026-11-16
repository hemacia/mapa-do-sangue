'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', rotulo: 'Estoque', ativo: (rota: string) => rota === '/' || rota.startsWith('/estado/') },
  { href: '/hemocentros', rotulo: 'Hemocentros', ativo: (rota: string) => rota === '/hemocentros' },
  { href: '/historico', rotulo: 'Histórico', ativo: (rota: string) => rota === '/historico' },
  { href: '/posso-doar', rotulo: 'Posso doar?', ativo: (rota: string) => rota === '/posso-doar' },
  { href: '/sobre', rotulo: 'Sobre os dados', curto: 'Sobre', ativo: (rota: string) => rota === '/sobre' },
]

export function Navegacao() {
  const rota = usePathname()
  return (
    <nav className="navegacao" aria-label="Principal">
      {LINKS.map(({ href, rotulo, ativo, ...resto }) => {
        // No celular "Sobre os dados" vira "Sobre" para os cinco itens caberem sem rolar.
        const curto = 'curto' in resto ? resto.curto : undefined
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo(rota) ? 'page' : undefined}
            aria-label={curto ? rotulo : undefined}
          >
            {curto ? (
              <>
                <span className="rotulo-longo">{rotulo}</span>
                <span className="rotulo-curto" aria-hidden="true">
                  {curto}
                </span>
              </>
            ) : (
              rotulo
            )}
          </Link>
        )
      })}
    </nav>
  )
}
