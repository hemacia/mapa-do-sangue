import Link from 'next/link'
import { Suspense } from 'react'
import { CartaoHemocentro } from '@/components/CartaoHemocentro'
import { EuDoei } from '@/components/EuDoei'
import { MapaBrasil } from '@/components/MapaBrasil'
import { PanoramaTipos } from '@/components/PanoramaTipos'
import { estatisticasPorUF, estoqueAtual } from '@/lib/api/dados'
import { formatarColeta } from '@/lib/domain/datas'
import { juntarTipos, montarManchete, panoramaPorTipo, tiposCriticos } from '@/lib/domain/panorama'
import { SITE } from '@/lib/site'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Estoque de sangue dos hemocentros do Brasil',
  description: SITE.descricao,
  url: SITE.url,
  inLanguage: 'pt-BR',
  isAccessibleForFree: true,
  license: 'https://opensource.org/licenses/MIT',
  spatialCoverage: { '@type': 'Place', name: 'Brasil' },
  creator: { '@type': 'Organization', name: SITE.nome, url: SITE.repositorio },
}

async function Estoque() {
  let hemocentros: Awaited<ReturnType<typeof estoqueAtual>>
  try {
    hemocentros = await estoqueAtual()
  } catch {
    return (
      <div className="manchete-painel" role="alert">
        <div className="manchete">
          <h1>Não foi possível carregar o estoque agora</h1>
          <p>A API pode estar fora do ar. Tente de novo em alguns minutos.</p>
        </div>
      </div>
    )
  }
  const estatisticas = await estatisticasPorUF().catch(() => [])
  const panorama = panoramaPorTipo(hemocentros)
  const manchete = montarManchete(panorama, hemocentros.length)
  const ultimaColeta = hemocentros
    .map((h) => h.coletadoEm)
    .sort()
    .at(-1)
  const ordenados = [...hemocentros].sort(
    (a, b) => tiposCriticos(b.estoque).length - tiposCriticos(a.estoque).length,
  )
  const [primeiro, ...resto] = manchete.tipos
  const ufs = [...new Set(hemocentros.map((h) => h.uf))].sort()
  return (
    <>
      <section className="manchete-painel" aria-labelledby="manchete">
        <div className="manchete">
          <h1 id="manchete">
            {primeiro ? (
              <>
                <span className="tipo">{juntarTipos([primeiro, ...resto])}</span>
                {manchete.titulo.slice(juntarTipos(manchete.tipos).length)}
              </>
            ) : (
              manchete.titulo
            )}
          </h1>
          {manchete.complemento && (
            <p>
              {manchete.complemento} Os hemocentros que publicam ficam em {juntarTipos(ufs)}.
            </p>
          )}
          {ultimaColeta && <p className="coleta">Coletado em {formatarColeta(ultimaColeta)}</p>}
        </div>
        <div className="acoes">
          <Link href="/posso-doar" className="botao botao-primario">
            Posso doar?
          </Link>
          <a href="#hemocentros" className="botao botao-contorno">
            Ver os hemocentros
          </a>
        </div>
        <PanoramaTipos panorama={panorama} hemocentros={hemocentros.length} />
      </section>
      <section className="palco" aria-label="Mapa do Brasil">
        <MapaBrasil estatisticas={estatisticas} hemocentros={hemocentros} />
      </section>
      <aside id="hemocentros" className="painel-hemocentros" aria-labelledby="titulo-hemocentros">
        <h2 id="titulo-hemocentros">Hemocentros que publicam</h2>
        <p>
          {hemocentros.length} hemocentros em {ufs.length} estados, do mais crítico para o menos
        </p>
        <ul className="lista-hemocentros">
          {ordenados.map((hemocentro) => (
            <li key={hemocentro.id}>
              <CartaoHemocentro hemocentro={hemocentro} />
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD montado no servidor com dados fixos
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="inicio">
        <Suspense fallback={<p className="manchete-painel">Carregando o estoque</p>}>
          <Estoque />
        </Suspense>
      </div>
      <EuDoei />
    </>
  )
}
