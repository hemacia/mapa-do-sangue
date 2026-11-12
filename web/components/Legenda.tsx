import { NIVEIS_ESTOQUE, ROTULOS_NIVEL } from '@/lib/domain/nivel'

export function Legenda() {
  return (
    <ul className="legenda" aria-label="Legenda dos níveis">
      {NIVEIS_ESTOQUE.map((nivel) => (
        <li key={nivel} className={`nivel-${nivel}`}>
          <span className="ponto" aria-hidden="true" />
          {ROTULOS_NIVEL[nivel]}
        </li>
      ))}
      <li className="nivel-sem-dado">
        <span className="ponto" aria-hidden="true" />
        Não publica o estoque
      </li>
    </ul>
  )
}
