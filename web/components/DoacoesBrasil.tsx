import type { EstatisticaUF } from '@/lib/api/cliente'
import { MINIMO_OMS_POR_MIL, panoramaNacional } from '@/lib/domain/brasil'
import { juntarTipos } from '@/lib/domain/panorama'
import { DoacoesNoSite } from './DoacoesNoSite'

const numero = (n: number) => n.toLocaleString('pt-BR')

// Barra embaixo do mapa: quanto o Brasil coleta por dia contra o mínimo da OMS, e quantas
// doações foram registradas neste site hoje e no mês.
export function DoacoesBrasil({ estatisticas }: { estatisticas: EstatisticaUF[] }) {
  const p = panoramaNacional(estatisticas)
  if (!p) return null
  const escala = Math.max(p.porDia, p.minimoPorDia) * 1.2
  return (
    <section className="doacoes-brasil" aria-labelledby="doacoes-brasil">
      <div className="doacoes-brasil-numero">
        <h2 id="doacoes-brasil">Sangue doado no Brasil</h2>
        <p>
          <strong>{numero(p.porDia)}</strong> bolsas por dia, em média, em {p.ano}
        </p>
      </div>
      <div className="doacoes-barra" aria-hidden="true">
        <span className="doacoes-barra-cheia" style={{ width: `${(p.porDia / escala) * 100}%` }} />
        <span className="doacoes-barra-minimo" style={{ left: `${(p.minimoPorDia / escala) * 100}%` }}>
          <small>mínimo da OMS</small>
        </span>
      </div>
      <p className="nota">
        O mínimo da OMS para o Brasil seria {numero(p.minimoPorDia)} bolsas por dia ({MINIMO_OMS_POR_MIL}{' '}
        doações por mil habitantes por ano).{' '}
        {p.abaixoDoMinimo.length > 0
          ? `${p.abaixoDoMinimo.length === 1 ? '1 estado fica' : `${p.abaixoDoMinimo.length} estados ficam`} abaixo dele: ${juntarTipos(p.abaixoDoMinimo)}.`
          : 'Todos os estados com dado completo passam dele.'}
      </p>
      <DoacoesNoSite />
    </section>
  )
}
