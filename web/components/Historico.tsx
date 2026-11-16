import type { EstatisticaUF } from '@/lib/api/cliente'
import { barrasDoEstado, periodoParcial, REFERENCIA_OMS } from '@/lib/domain/historico'
import { noEstado, type UF } from '@/lib/domain/ufs'
import { GraficoAnos } from './GraficoAnos'

const taxa = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
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
