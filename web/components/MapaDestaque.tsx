import { NOMES_UF, type UF } from '@/lib/domain/ufs'
import { desenharEstados } from '@/lib/mapa/geografia'

const LADO = 280

// Mapa pequeno da página do estado: o estado em destaque e, em azul forte, os que publicam o estoque.
export function MapaDestaque({ uf, ufsQuePublicam }: { uf: UF; ufsQuePublicam: string[] }) {
  const publica = ufsQuePublicam.includes(uf)
  return (
    <svg
      className="mapa-destaque"
      viewBox={`0 0 ${LADO} ${LADO}`}
      role="img"
      aria-label={`${NOMES_UF[uf]} destacado no mapa do Brasil`}
    >
      {desenharEstados(LADO, LADO).map((estado) => {
        const classes = [
          ufsQuePublicam.includes(estado.uf) && 'publica',
          estado.uf === uf && 'atual',
          estado.uf === uf && !publica && 'sem-estoque',
        ].filter(Boolean)
        return <path key={estado.uf} d={estado.d} className={classes.join(' ') || undefined} />
      })}
    </svg>
  )
}
