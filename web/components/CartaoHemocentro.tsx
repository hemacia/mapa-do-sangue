import Link from 'next/link'
import type { EstoqueHemocentro } from '@/lib/api/cliente'
import { formatarAtualizacao } from '@/lib/domain/datas'
import { juntarTipos, resumoDasBolsas, tiposCriticos } from '@/lib/domain/panorama'
import type { TipoSanguineo } from '@/lib/domain/tipos'
import { GradeTipos } from './GradeTipos'

// "nos 3 dias de histórico" quando todos os críticos ficaram assim o tempo todo.
function resumoDoHistorico(hemocentro: EstoqueHemocentro, tipos: TipoSanguineo[]): string {
  const historicos = tipos.map((tipo) => hemocentro.historico[tipo]).filter(Boolean)
  if (historicos.length === 0) return ''
  const sempre = historicos.every((h) => h.dias > 0 && h.diasCriticos === h.dias)
  const dias = Math.max(...historicos.map((h) => h.dias))
  if (sempre) return dias === 1 ? ', no único dia de histórico' : `, todos nos ${dias} dias de histórico`
  return ''
}

export function CartaoHemocentro({
  hemocentro,
  comLinkDoEstado = true,
}: {
  hemocentro: EstoqueHemocentro
  comLinkDoEstado?: boolean
}) {
  const criticos = tiposCriticos(hemocentro.estoque)
  const bolsas = resumoDasBolsas(hemocentro.bolsas)
  const atualizacao = hemocentro.atualizadoNaFonte
    ? `Atualizado pela fonte em ${formatarAtualizacao(hemocentro.atualizadoNaFonte)}`
    : 'A fonte não informa quando atualizou'
  return (
    <article className="hemocentro" aria-labelledby={`hemocentro-${hemocentro.id}`}>
      <div className="hemocentro-topo">
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
      <GradeTipos estoque={hemocentro.estoque} />
      <p className="criticos">
        {criticos.length === 0 ? (
          'Nenhum tipo crítico hoje'
        ) : (
          <>
            <strong>Crítico:</strong> {juntarTipos(criticos)}
            {resumoDoHistorico(hemocentro, criticos)}
          </>
        )}
      </p>
      {bolsas && (
        <p className="bolsas">
          <strong>Abaixo do mínimo:</strong> {bolsas}
        </p>
      )}
      <p className="fonte">{atualizacao}</p>
    </article>
  )
}
