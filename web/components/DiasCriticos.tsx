import type { EstoqueHemocentro } from '@/lib/api/cliente'
import { TIPOS_SANGUINEOS } from '@/lib/domain/tipos'

export function DiasCriticos({ historico }: { historico: EstoqueHemocentro['historico'] }) {
  const dias = Math.max(0, ...Object.values(historico).map((h) => h.dias))
  if (dias === 0) return <p className="nota">Ainda não há histórico guardado para este hemocentro.</p>
  return (
    <>
      <p className="nota">
        {dias === 1
          ? 'O histórico guardado até agora tem 1 dia.'
          : `O histórico guardado até agora tem ${dias} dias (no máximo os últimos 30).`}{' '}
        A barra mostra a parte desses dias em que o tipo esteve crítico.
      </p>
      <ul className="dias-criticos">
        {TIPOS_SANGUINEOS.map((tipo) => {
          const h = historico[tipo]
          const texto =
            !h || h.dias === 0
              ? 'sem dado'
              : h.diasCriticos === 0
                ? 'nenhum dia'
                : `${h.diasCriticos} de ${h.dias} ${h.dias === 1 ? 'dia' : 'dias'}`
          return (
            <li key={tipo}>
              <strong>{tipo}</strong>
              <span className="barra" aria-hidden="true">
                <span style={{ width: h?.dias ? `${(h.diasCriticos / h.dias) * 100}%` : 0 }} />
              </span>
              <small>{texto}</small>
            </li>
          )
        })}
      </ul>
    </>
  )
}
