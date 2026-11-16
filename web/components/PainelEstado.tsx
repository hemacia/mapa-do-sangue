'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { juntarTipos } from '@/lib/domain/panorama'
import type { ResumoEstado } from '@/lib/domain/resumo'
import type { UF } from '@/lib/domain/ufs'
import { GradeTipos } from './GradeTipos'

const taxa = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

// Clicar num estado (ou na placa dele) abre o resumo aqui mesmo, com "Ver mais" para a página.
// Ctrl/Cmd, Shift ou o botão do meio seguem o link normal; sem JavaScript, o link também funciona.
export function PainelEstado({ resumos }: { resumos: Record<UF, ResumoEstado> }) {
  const marcador = useRef<HTMLSpanElement>(null)
  const dialogo = useRef<HTMLDialogElement>(null)
  const [uf, setUf] = useState<UF | null>(null)

  useEffect(() => {
    const mapa = marcador.current?.closest('.mapa')
    if (!mapa) return
    function aoClicar(evento: Event) {
      const e = evento as MouseEvent
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="/estado/"]')
      const escolhida = link?.getAttribute('href')?.split('/')[2]?.toUpperCase() as UF | undefined
      // O "Ver mais" do próprio painel também aponta para /estado/: esse segue o link.
      if (!link || link.closest('dialog') || !escolhida || !resumos[escolhida]) return
      e.preventDefault()
      setUf(escolhida)
    }
    mapa.addEventListener('click', aoClicar)
    return () => mapa.removeEventListener('click', aoClicar)
  }, [resumos])

  // Clique no fundo escuro fecha (no teclado, o Esc já fecha o dialog).
  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    function noFundo(e: MouseEvent) {
      if (e.target === d) {
        d?.close?.()
        d?.removeAttribute('open')
        setUf(null)
      }
    }
    d.addEventListener('click', noFundo)
    return () => d.removeEventListener('click', noFundo)
  }, [])

  useEffect(() => {
    const d = dialogo.current
    if (!d || !uf || d.open) return
    if (typeof d.showModal === 'function') d.showModal()
    else d.setAttribute('open', '')
  }, [uf])

  function fechar() {
    dialogo.current?.close?.()
    dialogo.current?.removeAttribute('open')
    setUf(null)
  }

  const r = uf ? resumos[uf] : null
  return (
    <>
      <span ref={marcador} hidden />
      <dialog
        ref={dialogo}
        className="painel-estado"
        aria-labelledby="painel-estado-titulo"
        onClose={() => setUf(null)}
      >
        {r && (
          <div className="painel-estado-conteudo">
            <div className="painel-estado-topo">
              <h2 id="painel-estado-titulo">{r.nome}</h2>
              <button type="button" className="botao-fechar" onClick={fechar}>
                Fechar
              </button>
            </div>
            {r.hemocentros > 0 ? (
              <>
                <GradeTipos estoque={r.niveis} />
                <p className="painel-estado-manchete">
                  {r.criticos.length === 0
                    ? 'Nenhum tipo crítico hoje'
                    : `${r.criticos.length} de 8 tipos críticos hoje: ${juntarTipos(r.criticos)}`}
                </p>
                <p className="nota">
                  {r.hemocentros === 1 ? '1 hemocentro publica' : `${r.hemocentros} hemocentros publicam`} o
                  estoque. O nível de cada tipo é o pior entre eles.
                </p>
              </>
            ) : (
              <p className="painel-estado-manchete">Os hemocentros não publicam o estoque.</p>
            )}
            <dl className="painel-estado-fatos">
              <div>
                <dt>coletas por mil habitantes{r.ano ? ` em ${r.ano}` : ''}</dt>
                <dd>
                  {r.porMil !== null
                    ? taxa(r.porMil)
                    : r.cobertura === 'incompleto'
                      ? 'envio incompleto'
                      : 'sem dado'}
                </dd>
              </div>
              {r.posicao !== null && (
                <div>
                  <dt>no ranking dos estados</dt>
                  <dd>
                    {r.posicao}º de {r.total}
                  </dd>
                </div>
              )}
              {r.variacao && (
                <div>
                  <dt>
                    coletas de {r.variacao.de} para {r.variacao.para}
                  </dt>
                  <dd>
                    {r.variacao.percentual > 0 ? '+' : ''}
                    {taxa(r.variacao.percentual)}%
                  </dd>
                </div>
              )}
              {r.primeiraVez !== null && (
                <div>
                  <dt>dos doadores doaram pela primeira vez</dt>
                  <dd>{r.primeiraVez}%</dd>
                </div>
              )}
            </dl>
            <Link href={`/estado/${r.uf.toLowerCase()}`} className="botao botao-primario">
              Ver mais sobre {r.nome}
            </Link>
          </div>
        )}
      </dialog>
    </>
  )
}
