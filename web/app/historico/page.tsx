import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EsqueletoHistorico } from '@/components/Esqueletos'
import { GraficoAnos } from '@/components/GraficoAnos'
import { MapaDeCalor } from '@/components/MapaDeCalor'
import { ParcialEstados } from '@/components/ParcialEstados'
import { PerfilDoadores } from '@/components/PerfilDoadores'
import { estatisticasPorUF } from '@/lib/api/dados'
import {
  barrasDoBrasil,
  ESTADOS_FALTANDO_PARA_INCOMPLETO,
  indicadoresNacionais,
  parciaisPorEstado,
  parcialNacional,
  periodoParcial,
  resumoNacional,
  tabelaPorEstado,
} from '@/lib/domain/historico'

export const metadata: Metadata = {
  title: 'Histórico das doações',
  description:
    'Coletas de sangue no Brasil e em cada estado de 2010 até hoje, pela Anvisa: o total por ano, a taxa por mil habitantes e o ano em andamento.',
  alternates: { canonical: '/historico' },
}

const numero = (n: number) => n.toLocaleString('pt-BR')
const taxa = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const milhoes = (n: number) => `${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
const sinal = (n: number) => `${n > 0 ? '+' : ''}${taxa(n)}%`

async function ConteudoHistorico() {
  const estatisticas = await estatisticasPorUF().catch(() => [])
  const resumo = resumoNacional(estatisticas)
  if (!resumo) {
    return (
      <div className="pagina">
        <p role="alert" className="nota">
          Não foi possível carregar o histórico agora. Tente de novo em alguns minutos.
        </p>
      </div>
    )
  }
  const barras = barrasDoBrasil(estatisticas)
  const parcial = parcialNacional(estatisticas)
  const parciais = parciaisPorEstado(estatisticas)
  const { anos, linhas } = tabelaPorEstado(estatisticas)
  const nacional = { ...estatisticas[0], indicadores: indicadoresNacionais(estatisticas), serie: undefined }
  return (
    <>
      <section className="faixa-casco">
        <div className="faixa-casco-conteudo">
          <div className="faixa-casco-texto">
            <h1>Histórico das doações de sangue</h1>
            <p>
              O Brasil coletou {milhoes(resumo.coletas).replace(' mi', ' milhões')} de bolsas de sangue em{' '}
              {resumo.ano}. Os números vêm da Anvisa, que recebe a produção de cada serviço de hemoterapia do
              país, e vão de {barras[0].ano} até hoje.
            </p>
            <dl className="placa-estado">
              <div>
                <dt>bolsas coletadas em {resumo.ano}</dt>
                <dd>{numero(resumo.coletas)}</dd>
              </div>
              <div>
                <dt>coletas por mil habitantes</dt>
                <dd>{taxa(resumo.porMil)}</dd>
              </div>
              {resumo.variacao !== null && (
                <div>
                  <dt>contra {resumo.ano - 1}</dt>
                  <dd>{sinal(resumo.variacao)}</dd>
                </div>
              )}
              {parcial && (
                <div>
                  <dt>em {periodoParcial(parcial.ano, parcial.ateMes)}, mesmas unidades</dt>
                  <dd>{sinal(parcial.percentual)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      <div className="pagina">
        <section className="secao" aria-labelledby="por-ano">
          <div className="cabecalho">
            <h2 id="por-ano">
              Coletas no Brasil, {barras[0].ano} a {barras.at(-1)?.ano}
            </h2>
            <p className="nota">
              Total de bolsas coletadas por ano, somando os estados. O maior ano foi {resumo.recorde.ano}, com{' '}
              {numero(resumo.recorde.coletas)}. Quase todo ano algum estado pequeno deixa de mandar parte dos
              dados; com {ESTADOS_FALTANDO_PARA_INCOMPLETO} ou mais faltando, a barra fica listrada.
            </p>
          </div>
          <div className="caixa grafico-grande">
            <GraficoAnos
              barras={barras}
              formatar={milhoes}
              descrever={(b) =>
                `${b.ano}: ${numero(b.valor ?? 0)} coletas${b.faltando ? `, ${b.faltando === 1 ? '1 estado' : `${b.faltando} estados`} sem envio completo` : ''}`
              }
            />
            <p className="grafico-legenda">
              <span>
                listrado: {ESTADOS_FALTANDO_PARA_INCOMPLETO} estados ou mais sem envio completo, o total fica
                abaixo do real
              </span>
            </p>
          </div>
        </section>

        {parcial && parciais.length > 0 && (
          <section className="secao" aria-labelledby="ano-em-andamento">
            <div className="cabecalho">
              <h2 id="ano-em-andamento">{parcial.ano} até agora</h2>
              <p className="nota">
                Coletas de {periodoParcial(parcial.ano, parcial.ateMes)} contra o mesmo período de{' '}
                {parcial.ano - 1}, só nas unidades que já mandaram todos esses meses nos dois anos. A Anvisa
                publica o ano aos poucos; SP, RJ e quem manda só o total anual aparecem no começo do ano
                seguinte.
              </p>
            </div>
            <div className="caixa">
              <ParcialEstados parciais={parciais} />
            </div>
          </section>
        )}

        <section className="secao" aria-labelledby="por-estado">
          <div className="cabecalho">
            <h2 id="por-estado">Estado por estado</h2>
            <p className="nota">
              Cada linha é um estado e cada quadrado é um ano: quanto mais escuro, mais doações por mil
              habitantes, na mesma escala do mapa. Listrado é ano de envio incompleto à Anvisa, e o tracejado
              vazio é ano sem dado. O estado com a maior taxa em {anos.at(-1)} vem primeiro.
            </p>
          </div>
          <div className="caixa">
            <MapaDeCalor anos={anos} linhas={linhas} />
          </div>
        </section>

        <PerfilDoadores estatistica={nacional} titulo={`Quem doa no Brasil, ${resumo.ano}`} />

        <section className="secao" aria-labelledby="fontes-historico">
          <h2 id="fontes-historico">De onde vêm os números</h2>
          <p className="nota">
            Anvisa, Hemoprod: planilhas anuais de 2010 a 2021 e o CSV nacional a partir de 2022, baixado de
            novo todo mês. População do IBGE: estimativas anuais, o Censo em 2010 e 2022, e a média entre 2022
            e 2024 para 2023, que não tem estimativa.
          </p>
        </section>
      </div>
    </>
  )
}

export default function PaginaHistorico() {
  return (
    <Suspense fallback={<EsqueletoHistorico />}>
      <ConteudoHistorico />
    </Suspense>
  )
}
