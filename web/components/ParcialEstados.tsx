import Link from 'next/link'
import type { ParcialEstado } from '@/lib/domain/historico'
import { NOMES_UF, type UF } from '@/lib/domain/ufs'

const sinal = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

// Barras para os dois lados a partir do zero: azul é alta, laranja é queda (o vermelho fica para o
// estoque crítico). A escala corta em ±40% para um estado com poucas unidades não achatar o resto.
export function ParcialEstados({ parciais }: { parciais: ParcialEstado[] }) {
  const limite = Math.min(40, Math.max(...parciais.map((p) => Math.abs(p.percentual)), 5))
  return (
    <ul className="parcial-estados">
      {parciais.map(({ uf, percentual }) => {
        const largura = (Math.min(Math.abs(percentual), limite) / limite) * 50
        return (
          <li key={uf}>
            <Link href={`/estado/${uf.toLowerCase()}`}>{NOMES_UF[uf as UF]}</Link>
            <span className="parcial-trilho" aria-hidden="true">
              <span
                className={percentual >= 0 ? 'parcial-alta' : 'parcial-queda'}
                style={
                  percentual >= 0
                    ? { left: '50%', width: `${largura}%` }
                    : { right: '50%', width: `${largura}%` }
                }
              />
            </span>
            <span className="parcial-valor">{sinal(percentual)}</span>
          </li>
        )
      })}
    </ul>
  )
}
