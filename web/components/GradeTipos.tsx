import { type NivelEstoque, ROTULOS_NIVEL } from '@/lib/domain/nivel'
import type { Contagem } from '@/lib/domain/panorama'
import { TIPOS_SANGUINEOS } from '@/lib/domain/tipos'

// "linha": os 8 tipos numa faixa só (lista de hemocentros). "grande": blocos com o nível escrito.
export function GradeTipos({
  estoque,
  variante = 'linha',
  bolsas,
}: {
  estoque: Record<string, NivelEstoque>
  variante?: 'linha' | 'grande'
  bolsas?: Partial<Record<string, Contagem>>
}) {
  return (
    <ul className={variante === 'linha' ? 'tipos-linha' : 'tipos-grandes'}>
      {TIPOS_SANGUINEOS.map((tipo) => {
        const nivel = estoque[tipo]
        const rotulo = nivel ? ROTULOS_NIVEL[nivel] : 'Sem dado'
        const contagem = variante === 'grande' ? bolsas?.[tipo] : undefined
        return (
          <li key={tipo} className={`nivel-${nivel ?? 'sem-dado'}`} title={`${tipo}: ${rotulo}`}>
            <strong>{tipo}</strong>
            <span className={variante === 'linha' ? 'visualmente-oculto' : undefined}>
              {rotulo}
              {contagem && (
                <>
                  <small>
                    {contagem.bolsas} {contagem.bolsas === 1 ? 'bolsa' : 'bolsas'}
                  </small>
                  <small>mínimo {contagem.minimo}</small>
                </>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
