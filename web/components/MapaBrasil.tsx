import Link from 'next/link'
import type { CSSProperties } from 'react'
import { type NivelEstoque, ROTULOS_NIVEL } from '@/lib/domain/nivel'
import { NOMES_UF, type UF } from '@/lib/domain/ufs'
import { desenharEstados } from '@/lib/mapa/geografia'

const LADO = 600
// Estados pequenos demais para caber a sigla dentro.
const SEM_SIGLA = new Set<UF>(['DF', 'SE', 'AL', 'PB', 'RN', 'ES', 'RJ'])

export interface Camada {
  rotulo: string
  niveis: Record<UF, NivelEstoque | null>
}

// Cada estado leva a cor de todas as camadas em variáveis CSS (--f0, --f1...). O botão marcado
// escolhe qual variável vale, por CSS (:has), então trocar de tipo não precisa de JavaScript.
function coresDasCamadas(camadas: Camada[], uf: UF): CSSProperties {
  return Object.fromEntries(
    camadas.flatMap(({ niveis }, i) => {
      const nivel = niveis[uf]
      return [
        [`--f${i}`, `var(--${nivel ?? 'sem-dado'})`],
        [`--x${i}`, nivel ? '#fff' : 'var(--ink)'],
      ]
    }),
  )
}

export function MapaBrasil({ camadas }: { camadas: Camada[] }) {
  const estados = desenharEstados(LADO, LADO)
  const [geral] = camadas
  return (
    <figure className="mapa">
      <fieldset className="camadas">
        <legend className="visualmente-oculto">Ver no mapa</legend>
        {camadas.map((camada, i) => (
          <label key={camada.rotulo}>
            <input type="radio" name="camada" value={i} defaultChecked={i === 0} />
            {camada.rotulo}
          </label>
        ))}
      </fieldset>
      {/* biome-ignore lint/a11y/useSemanticElements: grupo de links dentro do SVG; fieldset não existe em SVG */}
      <svg
        viewBox={`0 0 ${LADO} ${LADO}`}
        role="group"
        aria-label="Mapa do Brasil com o nível de estoque por estado"
      >
        {estados.map(({ uf, d, centro }) => {
          const nivel = geral.niveis[uf]
          const rotulo = `${NOMES_UF[uf]}: ${nivel ? `pior nível ${ROTULOS_NIVEL[nivel].toLowerCase()}` : 'não publica o estoque'}`
          return (
            <Link
              key={uf}
              href={`/estado/${uf.toLowerCase()}`}
              aria-label={rotulo}
              style={coresDasCamadas(camadas, uf)}
            >
              <title>{rotulo}</title>
              <path d={d} />
              {!SEM_SIGLA.has(uf) && (
                <text x={centro[0]} y={centro[1]} textAnchor="middle" dominantBaseline="central">
                  {uf}
                </text>
              )}
            </Link>
          )
        })}
      </svg>
    </figure>
  )
}
