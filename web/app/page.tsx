import { Suspense } from 'react'
import { CartaoHemocentro } from '@/components/CartaoHemocentro'
import { EuDoei } from '@/components/EuDoei'
import { Legenda } from '@/components/Legenda'
import { MapaBrasil } from '@/components/MapaBrasil'
import { PanoramaTipos } from '@/components/PanoramaTipos'
import { estoqueAtual } from '@/lib/api/dados'
import { nivelPorUF } from '@/lib/domain/mapa'
import { panoramaPorTipo, tiposMaisEmFalta } from '@/lib/domain/panorama'
import { TIPOS_SANGUINEOS } from '@/lib/domain/tipos'
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
      <div className="coluna">
        <div className="vazio" role="alert">
          <p>Não foi possível carregar o estoque agora.</p>
          <p className="nota">A API pode estar fora do ar. Tente de novo em alguns minutos.</p>
        </div>
      </div>
    )
  }
  const panorama = panoramaPorTipo(hemocentros)
  const emFalta = tiposMaisEmFalta(panorama)
  return (
    <>
      <div className="coluna coluna-panorama">
        <section className="secao" aria-labelledby="titulo-panorama">
          <h2 id="titulo-panorama" className="titulo-secao">
            Panorama por tipo sanguíneo
          </h2>
          {emFalta.length > 0 && (
            <p style={{ marginBottom: 'var(--space-4)' }}>
              Mais em falta agora: <strong>{emFalta.join(', ')}</strong>
            </p>
          )}
          <PanoramaTipos panorama={panorama} />
          <p className="nota" style={{ marginTop: 'var(--space-3)' }}>
            Quanto mais cheia a barra, melhor o estoque somando os {hemocentros.length} hemocentros que
            publicam.
          </p>
        </section>
        <EuDoei />
      </div>
      <div className="coluna coluna-mapa">
        <MapaBrasil
          camadas={[
            { rotulo: 'Pior nível', niveis: nivelPorUF(hemocentros) },
            ...TIPOS_SANGUINEOS.map((tipo) => ({ rotulo: tipo, niveis: nivelPorUF(hemocentros, tipo) })),
          ]}
        />
        <Legenda />
        <p className="nota" style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
          Em “Pior nível”, cada estado mostra o tipo mais em falta entre os seus hemocentros. Clique num
          estado para ver os detalhes.
        </p>
      </div>
      <div className="coluna coluna-lista">
        <h2 className="titulo-secao">Hemocentros que publicam o estoque</h2>
        <ul className="lista">
          {hemocentros.map((hemocentro) => (
            <li key={hemocentro.id}>
              <CartaoHemocentro hemocentro={hemocentro} />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default function Home() {
  return (
    <div className="area">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD montado no servidor com dados fixos
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <h1 className="visualmente-oculto">Estoque de sangue dos hemocentros do Brasil</h1>
      <div className="colunas">
        <Suspense fallback={<p className="coluna nota">Carregando o estoque</p>}>
          <Estoque />
        </Suspense>
      </div>
    </div>
  )
}
