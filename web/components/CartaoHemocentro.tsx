import Link from 'next/link'
import type { EstoqueHemocentro } from '@/lib/api/cliente'
import { formatarAtualizacao } from '@/lib/domain/datas'
import { ROTULOS_NIVEL } from '@/lib/domain/nivel'
import { TIPOS_SANGUINEOS } from '@/lib/domain/tipos'
import { GradeTipos } from './GradeTipos'

export function CartaoHemocentro({
  hemocentro,
  comLinkDoEstado = true,
}: {
  hemocentro: EstoqueHemocentro
  comLinkDoEstado?: boolean
}) {
  const criticosNoMes = TIPOS_SANGUINEOS.flatMap((tipo) => {
    const historico = hemocentro.historico[tipo]
    return historico?.diasCriticos
      ? [`${tipo} em ${historico.diasCriticos} de ${historico.dias} ${historico.dias === 1 ? 'dia' : 'dias'}`]
      : []
  })
  return (
    <article className="cartao" aria-labelledby={`hemocentro-${hemocentro.id}`}>
      <div className="cartao-topo">
        <div>
          <h3 id={`hemocentro-${hemocentro.id}`}>{hemocentro.nome}</h3>
          <p className="local">
            {hemocentro.cidade},{' '}
            {comLinkDoEstado ? (
              <Link href={`/estado/${hemocentro.uf.toLowerCase()}`}>{hemocentro.uf}</Link>
            ) : (
              hemocentro.uf
            )}
          </p>
        </div>
        <span className={`selo nivel-${hemocentro.nivelGeral}`}>
          <span className="ponto" aria-hidden="true" />
          {ROTULOS_NIVEL[hemocentro.nivelGeral]}
        </span>
      </div>
      <GradeTipos estoque={hemocentro.estoque} />
      <p className="cartao-rodape">
        Atualizado pela fonte: {formatarAtualizacao(hemocentro.atualizadoNaFonte ?? null)}
        {criticosNoMes.length > 0 && <> · Crítico nos últimos 30 dias: {criticosNoMes.join(', ')}</>}
      </p>
    </article>
  )
}
