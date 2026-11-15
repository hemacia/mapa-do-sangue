import type { PanoramaTipo } from '@/lib/domain/panorama'

// Barra vermelha: em quantos dos hemocentros que informam o tipo ele está crítico.
export function PanoramaTipos({ panorama, hemocentros }: { panorama: PanoramaTipo[]; hemocentros: number }) {
  return (
    <section className="em-falta" aria-labelledby="titulo-em-falta">
      <h2 id="titulo-em-falta">Tipos em falta hoje</h2>
      <p>Em quantos dos {hemocentros} hemocentros cada tipo está crítico</p>
      <ul>
        {panorama.map(({ tipo, criticos, informados }) => (
          <li key={tipo} className={informados > 0 && criticos === informados ? 'todos' : undefined}>
            <strong>{tipo}</strong>
            <span className="barra" aria-hidden="true">
              <span style={{ width: informados ? `${(criticos / informados) * 100}%` : 0 }} />
            </span>
            <span className="contagem">
              {informados === 0 ? 'sem dado' : criticos === 0 ? 'nenhum' : `${criticos} de ${informados}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
