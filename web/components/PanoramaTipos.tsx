import type { PanoramaTipo } from '@/lib/domain/panorama'

// A cor da barra acompanha o quanto a "bolsa" está cheia, do crítico ao adequado.
function nivelDoPreenchimento(preenchimento: number) {
  if (preenchimento < 0.25) return 'critico'
  if (preenchimento < 0.5) return 'alerta'
  if (preenchimento < 0.75) return 'estavel'
  return 'adequado'
}

export function PanoramaTipos({ panorama }: { panorama: PanoramaTipo[] }) {
  return (
    <ul className="panorama">
      {panorama.map(({ tipo, criticos, informados, preenchimento }) => (
        <li
          key={tipo}
          className={`nivel-${preenchimento === null ? 'sem-dado' : nivelDoPreenchimento(preenchimento)}`}
        >
          <strong>{tipo}</strong>
          <span className="barra" aria-hidden="true">
            <span style={{ width: `${Math.max(4, (preenchimento ?? 0) * 100)}%` }} />
          </span>
          <span className="contagem">
            {informados === 0
              ? 'sem dado'
              : `${criticos} de ${informados} crítico${criticos === 1 ? '' : 's'}`}
          </span>
        </li>
      ))}
    </ul>
  )
}
