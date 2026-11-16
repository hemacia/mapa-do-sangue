import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { CartaoHemocentro } from '@/components/CartaoHemocentro'
import { EsqueletoHemocentros } from '@/components/Esqueletos'
import type { EstoqueHemocentro } from '@/lib/api/cliente'
import { estoqueAtual } from '@/lib/api/dados'
import { tiposCriticos } from '@/lib/domain/panorama'
import { NOMES_UF, type UF, UFS } from '@/lib/domain/ufs'

export const metadata: Metadata = {
  title: 'Hemocentros',
  description: 'Estoque de cada tipo sanguíneo em todos os hemocentros que publicam, separados por estado.',
  alternates: { canonical: '/hemocentros' },
}

// Estados em ordem alfabética do nome; dentro de cada um, o hemocentro mais crítico primeiro.
function porEstado(hemocentros: EstoqueHemocentro[]) {
  const grupos = new Map<UF, EstoqueHemocentro[]>()
  for (const h of hemocentros) grupos.set(h.uf as UF, [...(grupos.get(h.uf as UF) ?? []), h])
  return [...grupos]
    .sort(([a], [b]) => NOMES_UF[a].localeCompare(NOMES_UF[b], 'pt-BR'))
    .map(
      ([uf, lista]) =>
        [
          uf,
          lista.sort((a, b) => tiposCriticos(b.estoque).length - tiposCriticos(a.estoque).length),
        ] as const,
    )
}

async function ListaHemocentros() {
  let hemocentros: EstoqueHemocentro[]
  try {
    hemocentros = await estoqueAtual()
  } catch {
    return (
      <p role="alert" className="nota">
        Não foi possível carregar os hemocentros agora. Tente de novo em alguns minutos.
      </p>
    )
  }
  const grupos = porEstado(hemocentros)
  const semEstoque = UFS.filter((uf) => !grupos.some(([g]) => g === uf))
  return (
    <>
      <p className="nota">
        {hemocentros.length} hemocentros em {grupos.length} estados publicam o estoque de um jeito que dá para
        acompanhar.
      </p>
      <div className="hemocentros-estados">
        {grupos.map(([uf, lista]) => (
          <section
            key={uf}
            className={lista.length > 1 ? 'secao varios' : 'secao'}
            aria-labelledby={`estado-${uf}`}
          >
            <div className="hemocentros-estado-topo">
              <h2 id={`estado-${uf}`}>{NOMES_UF[uf]}</h2>
              <Link href={`/estado/${uf.toLowerCase()}`}>Ver o estado</Link>
            </div>
            <ul className="hemocentros-grade">
              {lista.map((h) => (
                <li key={h.id}>
                  <CartaoHemocentro hemocentro={h} comLinkDoEstado={false} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="secao" aria-labelledby="sem-estoque">
        <h2 id="sem-estoque">Estados sem estoque publicado</h2>
        <p className="nota">Na página de cada um há os endereços para doar e quem doa no estado.</p>
        <ul className="estados-links">
          {semEstoque.map((uf) => (
            <li key={uf}>
              <Link href={`/estado/${uf.toLowerCase()}`}>{NOMES_UF[uf]}</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

export default function PaginaHemocentros() {
  return (
    <div className="pagina">
      <div className="cabecalho">
        <h1>Hemocentros</h1>
        <p>O estoque de cada tipo sanguíneo em todos os hemocentros que publicam, separados por estado.</p>
      </div>
      <Suspense fallback={<EsqueletoHemocentros />}>
        <ListaHemocentros />
      </Suspense>
    </div>
  )
}
