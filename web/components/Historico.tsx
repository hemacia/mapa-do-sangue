import type { EstatisticaUF } from '@/lib/api/cliente'
import {
  barrasDoBrasil,
  barrasDoEstado,
  ESTADOS_FALTANDO_PARA_INCOMPLETO,
  parcialNacional,
  periodoParcial,
  REFERENCIA_OMS,
} from '@/lib/domain/historico'
import { noEstado, type UF } from '@/lib/domain/ufs'
import { GraficoAnos } from './GraficoAnos'

const taxa = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const milhoes = (n: number) => `${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
const sinal = (n: number) => `${n > 0 ? '+' : ''}${taxa(n)}%`

function Legenda() {
  return (
    <p className="grafico-legenda">
      <span>listrado: envio incompleto à Anvisa naquele ano</span>
    </p>
  )
}

export function HistoricoEstado({ uf, estatistica }: { uf: UF; estatistica?: EstatisticaUF }) {
  const barras = barrasDoEstado(estatistica?.serie)
  if (barras.length === 0) return null
  const primeiro = barras[0].ano
  const ultimo = barras.at(-1)?.ano
  const p = estatistica?.parcial
  return (
    <section className="secao" aria-labelledby="historico">
      <div className="cabecalho">
        <h2 id="historico">Coletas por ano {noEstado(uf)}</h2>
        <p className="nota">
          Coletas por mil habitantes de {primeiro} a {ultimo}, pela Anvisa (Hemoprod). A linha tracejada é o
          mínimo da OMS, {REFERENCIA_OMS} por mil.
        </p>
      </div>
      <div className="caixa">
        <GraficoAnos
          barras={barras}
          formatar={taxa}
          referencia={{ valor: REFERENCIA_OMS }}
          descrever={(b) =>
            b.valor === null
              ? `${b.ano}: sem dado`
              : `${b.ano}: ${taxa(b.valor)} coletas por mil habitantes${b.incompleto ? ', envio incompleto' : ''}`
          }
        />
        {barras.some((b) => b.incompleto) && <Legenda />}
      </div>
      <p className="nota">
        {p
          ? `Em ${periodoParcial(p.ano, p.ateMes)}, as unidades que já mandaram todos esses meses coletaram ${sinal(((p.coletas - p.coletasAnoAnterior) / p.coletasAnoAnterior) * 100)} que no mesmo período de ${p.ano - 1}. O ano ainda está sendo publicado pela Anvisa.`
          : `A Anvisa ainda não publicou meses de ${(ultimo ?? 0) + 1} para este estado. SP, RJ e parte de MG mandam só o total do ano, no começo do ano seguinte.`}
      </p>
    </section>
  )
}

export function HistoricoBrasil({ estatisticas }: { estatisticas: EstatisticaUF[] }) {
  const barras = barrasDoBrasil(estatisticas)
  if (barras.length === 0) return null
  const p = parcialNacional(estatisticas)
  return (
    <section className="historico-brasil" aria-labelledby="historico-brasil">
      <div className="cabecalho">
        <h2 id="historico-brasil">
          Coletas de sangue no Brasil, {barras[0].ano} a {barras.at(-1)?.ano}
        </h2>
        <p className="nota">
          Total de bolsas coletadas por ano, somando os estados (Anvisa, Hemoprod).
          {p &&
            ` Em ${periodoParcial(p.ano, p.ateMes)}, nas unidades de ${p.estados === 1 ? '1 estado' : `${p.estados} estados`} que já mandaram esses meses, foram ${sinal(p.percentual)} que no mesmo período de ${p.ano - 1}.`}
        </p>
      </div>
      <div className="caixa">
        <GraficoAnos
          barras={barras}
          formatar={milhoes}
          descrever={(b) =>
            `${b.ano}: ${(b.valor ?? 0).toLocaleString('pt-BR')} coletas${b.faltando ? `, ${b.faltando === 1 ? '1 estado' : `${b.faltando} estados`} sem envio completo` : ''}`
          }
        />
        {barras.some((b) => b.incompleto) && (
          <p className="grafico-legenda">
            <span>
              listrado: {ESTADOS_FALTANDO_PARA_INCOMPLETO} estados ou mais sem envio completo, o total fica
              bem abaixo do real
            </span>
          </p>
        )}
      </div>
    </section>
  )
}
