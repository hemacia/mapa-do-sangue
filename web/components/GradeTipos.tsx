import { type NivelEstoque, ROTULOS_NIVEL } from '@/lib/domain/nivel'
import { TIPOS_SANGUINEOS } from '@/lib/domain/tipos'

// "linha": os 8 tipos numa faixa só (lista de hemocentros). "grande": blocos com o nível escrito.
export function GradeTipos({
  estoque,
  variante = 'linha',
}: {
  estoque: Record<string, NivelEstoque>
  variante?: 'linha' | 'grande'
}) {
  return (
    <ul className={variante === 'linha' ? 'tipos-linha' : 'tipos-grandes'}>
      {TIPOS_SANGUINEOS.map((tipo) => {
        const nivel = estoque[tipo]
        const rotulo = nivel ? ROTULOS_NIVEL[nivel] : 'Sem dado'
        return (
          <li key={tipo} className={`nivel-${nivel ?? 'sem-dado'}`} title={`${tipo}: ${rotulo}`}>
            <strong>{tipo}</strong>
            <span className={variante === 'linha' ? 'visualmente-oculto' : undefined}>{rotulo}</span>
          </li>
        )
      })}
    </ul>
  )
}
