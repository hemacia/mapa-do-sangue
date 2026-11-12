import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { CartaoHemocentro } from '@/components/CartaoHemocentro'
import { estatisticasPorUF, estoqueAtual } from '@/lib/api/dados'
import { NOMES_UF, type UF, UFS } from '@/lib/domain/ufs'

export function generateStaticParams() {
  return UFS.map((uf) => ({ uf: uf.toLowerCase() }))
}

function ufDoParametro(parametro: string): UF | null {
  const uf = parametro.toUpperCase()
  return (UFS as string[]).includes(uf) ? (uf as UF) : null
}

export async function generateMetadata({ params }: PageProps<'/estado/[uf]'>): Promise<Metadata> {
  const uf = ufDoParametro((await params).uf)
  if (!uf) return {}
  const nome = NOMES_UF[uf]
  return {
    title: `Estoque de sangue em ${nome} (${uf})`,
    description: `Nível de cada tipo sanguíneo nos hemocentros de ${nome}, histórico de dias críticos e coletas por habitante.`,
    alternates: { canonical: `/estado/${uf.toLowerCase()}` },
  }
}

async function Hemocentros({ uf }: { uf: UF }) {
  const [hemocentros, estatisticas] = await Promise.all([
    estoqueAtual().then((lista) => lista.filter((h) => h.uf === uf)),
    estatisticasPorUF().catch(() => []),
  ])
  const estatistica = estatisticas.find((e) => e.uf === uf)
  return (
    <>
      {estatistica?.porMil != null && (
        <p className="destaque" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="numero">{estatistica.porMil.toLocaleString('pt-BR')}</span>
          coletas de sangue por mil habitantes em {estatistica.ano} (Anvisa Hemoprod e IBGE)
          {estatistica.cobertura === 'incompleto' &&
            '. O número parece baixo: o estado provavelmente não enviou todos os dados à Anvisa.'}
        </p>
      )}
      {hemocentros.length === 0 ? (
        <div className="vazio">
          <p>
            Os hemocentros de {NOMES_UF[uf]} ainda não publicam o estoque de forma que dê para acompanhar.
          </p>
          <p>
            Doar continua fazendo diferença: veja se você <Link href="/posso-doar">pode doar</Link> e procure
            o hemocentro mais perto de você.
          </p>
        </div>
      ) : (
        <ul className="lista">
          {hemocentros.map((hemocentro) => (
            <li key={hemocentro.id}>
              <CartaoHemocentro hemocentro={hemocentro} comLinkDoEstado={false} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

async function ConteudoEstado({ params }: Pick<PageProps<'/estado/[uf]'>, 'params'>) {
  const uf = ufDoParametro((await params).uf)
  if (!uf) notFound()
  return (
    <>
      <nav className="nota" aria-label="Trilha">
        <Link href="/">Brasil</Link> / {NOMES_UF[uf]}
      </nav>
      <div className="cabecalho" style={{ marginTop: 'var(--space-3)' }}>
        <h1>Estoque de sangue em {NOMES_UF[uf]}</h1>
        <p>Nível de cada tipo sanguíneo, coletado duas vezes por dia dos sites oficiais dos hemocentros.</p>
      </div>
      <Hemocentros uf={uf} />
    </>
  )
}

// Os 27 estados saem prontos do build (generateStaticParams); o Suspense só aparece para URL desconhecida.
export default function PaginaEstado({ params }: PageProps<'/estado/[uf]'>) {
  return (
    <div className="pagina">
      <Suspense fallback={<p className="nota">Carregando o estoque</p>}>
        <ConteudoEstado params={params} />
      </Suspense>
    </div>
  )
}
