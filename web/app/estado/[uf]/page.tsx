import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { DiasCriticos } from '@/components/DiasCriticos'
import { GradeTipos } from '@/components/GradeTipos'
import { MapaDestaque } from '@/components/MapaDestaque'
import type { EstatisticaUF } from '@/lib/api/cliente'
import { estatisticasPorUF, estoqueAtual } from '@/lib/api/dados'
import { formatarAtualizacao } from '@/lib/domain/datas'
import { type Posicao, posicaoNoRanking } from '@/lib/domain/estatisticas'
import { nivelPorUF } from '@/lib/domain/mapa'
import { juntarTipos, tiposCriticos } from '@/lib/domain/panorama'
import { TIPOS_SANGUINEOS } from '@/lib/domain/tipos'
import { doEstado, NOMES_UF, noEstado, type UF, UFS } from '@/lib/domain/ufs'
import { SITES_HEMOCENTROS } from '@/lib/hemocentros'
import { SITE } from '@/lib/site'

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
    title: `Estoque de sangue ${noEstado(uf)} (${uf})`,
    description: `Nível de cada tipo sanguíneo nos hemocentros ${doEstado(uf)}, histórico de dias críticos e coletas por habitante.`,
    alternates: { canonical: `/estado/${uf.toLowerCase()}` },
  }
}

function formatarTaxa(valor: number) {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function FatoColetas({ estatistica, posicao }: { estatistica?: EstatisticaUF; posicao: Posicao | null }) {
  const ano = estatistica?.ano ?? 2024
  let valor = <>sem dado</>
  if (estatistica?.cobertura === 'incompleto') {
    valor = <>envio incompleto</>
  } else if (estatistica?.porMil != null) {
    valor = <>{formatarTaxa(estatistica.porMil)}</>
  }
  return (
    <div>
      <dt>
        {estatistica?.cobertura === 'incompleto'
          ? `à Anvisa em ${ano}`
          : posicao
            ? `coletas por mil habitantes em ${ano} (${posicao.posicao}º de ${posicao.total}, mediana ${formatarTaxa(posicao.mediana)})`
            : `coletas por mil habitantes em ${ano}`}
      </dt>
      <dd>{valor}</dd>
    </div>
  )
}

async function ConteudoEstado({ params }: Pick<PageProps<'/estado/[uf]'>, 'params'>) {
  const uf = ufDoParametro((await params).uf)
  if (!uf) notFound()
  const [todos, estatisticas] = await Promise.all([estoqueAtual(), estatisticasPorUF().catch(() => [])])
  const hemocentros = todos.filter((h) => h.uf === uf)
  const estatistica = estatisticas.find((e) => e.uf === uf)
  const posicao = posicaoNoRanking(estatisticas, uf)
  const ufsQuePublicam = [...new Set(todos.map((h) => h.uf))]
  const publica = hemocentros.length > 0
  const criticos = TIPOS_SANGUINEOS.filter((tipo) => nivelPorUF(hemocentros, tipo)[uf] === 'critico')
  const site = hemocentros.map((h) => SITES_HEMOCENTROS[h.id]).find(Boolean)
  const outros = todos
    .filter((h) => h.uf !== uf)
    .map((h) => ({ uf: h.uf as UF, criticos: tiposCriticos(h.estoque).length }))
    .sort((a, b) => b.criticos - a.criticos)

  let resumo: string
  if (!publica) {
    resumo = `Os hemocentros ${doEstado(uf)} ainda não publicam o estoque de um jeito que dê para acompanhar.`
  } else if (criticos.length === 0) {
    resumo = 'Nenhum tipo está crítico hoje nos hemocentros que publicam.'
  } else {
    const onde =
      hemocentros.length === 1
        ? `${hemocentros[0].nome}, em ${hemocentros[0].cidade}`
        : `Somando os ${hemocentros.length} hemocentros`
    resumo = `${onde}: ${criticos.length} dos 8 tipos ${criticos.length === 1 ? 'está crítico' : 'estão críticos'} hoje: ${juntarTipos(criticos)}.`
  }

  return (
    <>
      <section className="faixa-casco">
        <div className="faixa-casco-conteudo">
          <div className="faixa-casco-texto">
            <nav className="trilha" aria-label="Trilha">
              <Link href="/">Brasil</Link> / {NOMES_UF[uf]}
            </nav>
            <h1>Estoque de sangue {noEstado(uf)}</h1>
            <p>{resumo}</p>
            <dl className="placa-estado">
              <div>
                <dt>{publica ? 'tipos críticos hoje' : 'hoje'}</dt>
                <dd>{publica ? `${criticos.length} de 8` : 'Estoque não publicado'}</dd>
              </div>
              <FatoColetas estatistica={estatistica} posicao={posicao} />
              {hemocentros.length === 1 && (
                <div className="rotulo-antes">
                  <dt>atualizado pela fonte em</dt>
                  <dd>{formatarAtualizacao(hemocentros[0].atualizadoNaFonte ?? null)}</dd>
                </div>
              )}
            </dl>
            <div className="acoes">
              <Link href="/posso-doar" className="botao botao-primario">
                Posso doar?
              </Link>
              {site && (
                <a href={site} className="botao botao-contorno">
                  Ver onde doar no site oficial
                </a>
              )}
            </div>
          </div>
          <MapaDestaque uf={uf} ufsQuePublicam={ufsQuePublicam} />
        </div>
      </section>

      <div className="pagina">
        {hemocentros.map((hemocentro) => (
          <section key={hemocentro.id} className="secao" aria-labelledby={`hemocentro-${hemocentro.id}`}>
            <h2 id={`hemocentro-${hemocentro.id}`}>
              {hemocentro.nome}, {hemocentro.cidade}
            </h2>
            <GradeTipos estoque={hemocentro.estoque} variante="grande" />
            <div className="caixa secao">
              <h3 className="titulo" style={{ fontSize: 'var(--text-xl)' }}>
                Dias em nível crítico
              </h3>
              <DiasCriticos historico={hemocentro.historico} />
            </div>
          </section>
        ))}

        {!publica && (
          <section className="caixa secao" aria-labelledby="sugerir">
            <h2 id="sugerir">Quer ver este estado no mapa?</h2>
            <p className="nota">
              O mapa só mostra o que os hemocentros publicam. Se você conhece uma página oficial com o estoque{' '}
              {doEstado(uf)}, conte para nós no GitHub.
            </p>
            <a
              href={`${SITE.repositorio}/issues`}
              className="botao botao-escuro"
              style={{ alignSelf: 'flex-start' }}
            >
              Sugerir uma fonte
            </a>
          </section>
        )}

        {outros.length > 0 && (
          <section className="secao" aria-labelledby="outros-estados">
            <h2 id="outros-estados">
              {publica ? 'Outros estados que publicam o estoque' : 'Estados que publicam o estoque'}
            </h2>
            <ul className="estados-links">
              {outros.map((outro) => (
                <li key={outro.uf}>
                  <Link href={`/estado/${outro.uf.toLowerCase()}`}>
                    {NOMES_UF[outro.uf]}{' '}
                    <span>
                      {outro.criticos} crítico{outro.criticos === 1 ? '' : 's'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}

// Os 27 estados saem prontos do build (generateStaticParams); o Suspense só aparece para URL desconhecida.
export default function PaginaEstado({ params }: PageProps<'/estado/[uf]'>) {
  return (
    <Suspense fallback={<p className="pagina nota">Carregando o estoque</p>}>
      <ConteudoEstado params={params} />
    </Suspense>
  )
}
