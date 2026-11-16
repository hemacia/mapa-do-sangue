import type { CSSProperties } from 'react'
import type { Barra } from '@/lib/domain/historico'

interface Props {
  barras: Barra[]
  formatar: (valor: number) => string
  descrever: (barra: Barra) => string // texto completo de cada ano, para o leitor de tela e o tooltip
  referencia?: { valor: number } // linha tracejada; quem usa explica a linha no texto acima
}

// Barras por ano em HTML: o texto continua legível em qualquer largura e cada ano é um item de lista
// com a descrição completa, então a lista já é a tabela do gráfico. Ano listrado = envio incompleto.
export function GraficoAnos({ barras, formatar, descrever, referencia }: Props) {
  const valores = barras.flatMap((b) => (b.valor === null ? [] : [b.valor]))
  if (valores.length === 0) return null
  const maximo = Math.max(...valores, referencia?.valor ?? 0) * 1.12
  const maior = Math.max(...valores)
  const ultimo = barras.findLast((b) => b.valor !== null)
  return (
    <div className="grafico-anos" style={{ '--colunas': barras.length } as CSSProperties}>
      <div className="grafico-area">
        {referencia && (
          <span
            className="grafico-referencia"
            style={{ bottom: `${(referencia.valor / maximo) * 100}%` } as CSSProperties}
            aria-hidden="true"
          />
        )}
        <ol>
          {barras.map((b) => {
            const destaque = b.valor !== null && (b === ultimo || b.valor === maior)
            return (
              <li key={b.ano} title={descrever(b)} className={b.incompleto ? 'incompleto' : undefined}>
                <span className="visualmente-oculto">{descrever(b)}</span>
                <span className="grafico-coluna" aria-hidden="true">
                  {destaque && b.valor !== null && (
                    <small className="grafico-valor">{formatar(b.valor)}</small>
                  )}
                  <span
                    className="grafico-barra"
                    style={{ height: `${b.valor === null ? 0 : (b.valor / maximo) * 100}%` }}
                  />
                </span>
                <span className="grafico-ano" aria-hidden="true">
                  {String(b.ano).slice(2)}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
