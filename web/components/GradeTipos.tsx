import { type NivelEstoque, ROTULOS_NIVEL } from '@/lib/domain/nivel'
import { TIPOS_SANGUINEOS } from '@/lib/domain/tipos'

export function GradeTipos({ estoque }: { estoque: Record<string, NivelEstoque> }) {
  return (
    <ul className="grade-tipos">
      {TIPOS_SANGUINEOS.map((tipo) => {
        const nivel = estoque[tipo]
        return (
          <li key={tipo} className={`tipo nivel-${nivel ?? 'sem-dado'}`}>
            <strong>{tipo}</strong>
            <span>{nivel ? ROTULOS_NIVEL[nivel] : 'Sem dado'}</span>
          </li>
        )
      })}
    </ul>
  )
}
