import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { EstatisticaUF, EstoqueHemocentro } from '@/lib/api/cliente'
import { faixaDeColetas, LIMITES_FAIXAS } from '@/lib/domain/estatisticas'
import { nivelPorUF } from '@/lib/domain/mapa'
import { NIVEIS_ESTOQUE, type NivelEstoque, ROTULOS_NIVEL } from '@/lib/domain/nivel'
import { TIPOS_SANGUINEOS } from '@/lib/domain/tipos'
import { NOMES_UF, type UF } from '@/lib/domain/ufs'
import { desenharEstados } from '@/lib/mapa/geografia'

const LADO = 600
// Estados pequenos demais para caber a sigla dentro.
const SEM_SIGLA = new Set<UF>(['DF', 'SE', 'AL', 'PB', 'RN', 'ES', 'RJ'])
// A placa vai à esquerda do estado. A do ES cairia em cima da de MG: com espaço, vai para o mar,
// à direita; num palco estreito sobe para o vão entre BA e MG (posição em % do mapa).
const PLACA_NO_MAR: Partial<Record<UF, { x: number; y: number }>> = { ES: { x: 67.6, y: 50.5 } }

const TINTA_CLARA = '#ffffff'
const TINTA_ESCURA = '#0b2235'

function formatarTaxa(valor: number) {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function descreverColetas(estatistica: EstatisticaUF | undefined): string {
  if (!estatistica || estatistica.cobertura === 'sem-dado' || estatistica.porMil === null) {
    return 'sem dado da Anvisa'
  }
  if (estatistica.cobertura === 'incompleto') return 'envio incompleto à Anvisa'
  return `${formatarTaxa(estatistica.porMil)} coletas por mil habitantes`
}

interface Placa {
  uf: UF
  niveis: (NivelEstoque | null)[]
  criticos: number
}

function contarCriticos(niveis: (NivelEstoque | null)[]) {
  return niveis.filter((nivel) => nivel === 'critico').length
}

// Cada estado leva a cor de todas as camadas em variáveis CSS (--f0, --f1...). O botão marcado
// escolhe qual variável vale, por CSS (:has), então trocar de camada não precisa de JavaScript.
function coresDoEstado(
  estatistica: EstatisticaUF | undefined,
  niveis: (NivelEstoque | null)[],
): CSSProperties {
  const faixa = estatistica ? faixaDeColetas(estatistica.porMil, estatistica.cobertura) : null
  const geral =
    typeof faixa === 'number'
      ? { '--f0': `var(--faixa-${faixa})`, '--x0': faixa >= 3 ? TINTA_CLARA : TINTA_ESCURA }
      : { '--f0': 'url(#hachura-incompleto)', '--x0': TINTA_ESCURA }
  const porTipo = niveis.flatMap((nivel, i) => [
    [`--f${i + 1}`, nivel ? `var(--${nivel})` : 'url(#hachura-sem-estoque)'],
    [`--x${i + 1}`, nivel === 'alerta' ? 'var(--sobre-alerta)' : nivel ? TINTA_CLARA : '#9fbdd2'],
  ])
  return { ...geral, ...Object.fromEntries(porTipo) }
}

function PlacaConteudo({ placa }: { placa: Placa }) {
  return (
    <>
      <strong>{placa.uf}</strong>
      <span className="placa-tipos" aria-hidden="true">
        {placa.niveis.map((nivel, i) => (
          <i key={TIPOS_SANGUINEOS[i]} className={`nivel-${nivel ?? 'sem-dado'}`} />
        ))}
      </span>
      <span className="placa-resumo">
        {placa.criticos} crítico{placa.criticos === 1 ? '' : 's'}
      </span>
      {placa.niveis.map((nivel, i) => (
        <span key={TIPOS_SANGUINEOS[i]} className="placa-nivel" data-camada={i + 1}>
          {nivel ? ROTULOS_NIVEL[nivel] : 'Sem dado'}
        </span>
      ))}
    </>
  )
}

function rotuloDaPlaca(placa: Placa) {
  return `Estoque de ${NOMES_UF[placa.uf]}: ${placa.criticos} de 8 tipos críticos hoje`
}

export function MapaBrasil({
  estatisticas,
  hemocentros,
}: {
  estatisticas: EstatisticaUF[]
  hemocentros: Pick<EstoqueHemocentro, 'uf' | 'nivelGeral' | 'estoque'>[]
}) {
  const estados = desenharEstados(LADO, LADO)
  const porTipo = TIPOS_SANGUINEOS.map((tipo) => nivelPorUF(hemocentros, tipo))
  const ufsQuePublicam = new Set(hemocentros.map((h) => h.uf as UF))
  const ano = estatisticas[0]?.ano
  const placas: (Placa & { centro: [number, number] })[] = estados
    .filter(({ uf }) => ufsQuePublicam.has(uf))
    .map(({ uf, centro }) => {
      const niveis = porTipo.map((niveisDoTipo) => niveisDoTipo[uf])
      return { uf, centro, niveis, criticos: contarCriticos(niveis) }
    })
    .sort((a, b) => b.criticos - a.criticos)

  return (
    <figure className="mapa">
      <fieldset className="camadas">
        <legend className="visualmente-oculto">Ver no mapa</legend>
        <label className="camada-geral">
          <input type="radio" name="camada" value={0} defaultChecked />
          Doações por estado
        </label>
        <span className="rotulo-tipos" aria-hidden="true">
          Estoque de hoje do tipo
        </span>
        {TIPOS_SANGUINEOS.map((tipo, i) => (
          <label key={tipo}>
            <input type="radio" name="camada" value={i + 1} aria-label={`Estoque de hoje do tipo ${tipo}`} />
            {tipo}
          </label>
        ))}
      </fieldset>

      <div className="mapa-area">
        {/* biome-ignore lint/a11y/useSemanticElements: grupo de links dentro do SVG; fieldset não existe em SVG */}
        <svg viewBox={`0 0 ${LADO} ${LADO}`} role="group" aria-label="Mapa do Brasil por estado">
          <defs>
            <pattern
              id="hachura-incompleto"
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="7" height="7" style={{ fill: 'var(--hachura-a)' }} />
              <rect width="2.5" height="7" style={{ fill: 'var(--hachura-b)' }} />
            </pattern>
            <pattern
              id="hachura-sem-estoque"
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="7" height="7" style={{ fill: 'var(--sem-estoque-a)' }} />
              <rect width="2" height="7" style={{ fill: 'var(--sem-estoque-b)' }} />
            </pattern>
          </defs>
          {estados.map(({ uf, d, centro }) => {
            const estatistica = estatisticas.find((e) => e.uf === uf)
            const niveis = porTipo.map((niveisDoTipo) => niveisDoTipo[uf])
            const estoque = ufsQuePublicam.has(uf)
              ? `${contarCriticos(niveis)} de 8 tipos críticos hoje`
              : 'o hemocentro não publica o estoque'
            const rotulo = `${NOMES_UF[uf]}: ${descreverColetas(estatistica)}; ${estoque}`
            return (
              <Link
                key={uf}
                href={`/estado/${uf.toLowerCase()}`}
                aria-label={rotulo}
                style={coresDoEstado(estatistica, niveis)}
              >
                <title>{rotulo}</title>
                <path d={d} />
                {/* Quem tem placa já mostra a sigla nela; no mapa ficaria embaixo do ponto. */}
                {!SEM_SIGLA.has(uf) && !ufsQuePublicam.has(uf) && (
                  <text x={centro[0]} y={centro[1]} textAnchor="middle" dominantBaseline="central">
                    {uf}
                  </text>
                )}
              </Link>
            )
          })}
        </svg>

        {/* biome-ignore lint/a11y/noSvgWithoutTitle: só as linhas que ligam as placas aos estados */}
        <svg className="placas-linhas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {placas.map((placa) => {
            const x = (placa.centro[0] / LADO) * 100
            const y = (placa.centro[1] / LADO) * 100
            const terra = PLACA_NO_MAR[placa.uf]
            return terra ? (
              <g key={placa.uf}>
                <line className="linha-mar" x1={x} y1={y} x2={x + 6} y2={y} />
                <line className="linha-terra" x1={terra.x} y1={terra.y} x2={x} y2={y} />
              </g>
            ) : (
              <line key={placa.uf} x1={x - 6} y1={y} x2={x} y2={y} />
            )
          })}
        </svg>
        <ul className="placas">
          {placas.map((placa) => {
            const x = (placa.centro[0] / LADO) * 100
            const y = (placa.centro[1] / LADO) * 100
            const terra = PLACA_NO_MAR[placa.uf]
            const posicao = terra
              ? ({
                  '--mar-esquerda': `${x + 6}%`,
                  '--mar-topo': `${y}%`,
                  '--terra-direita': `${100 - terra.x}%`,
                  '--terra-topo': `${terra.y}%`,
                } as CSSProperties)
              : { right: `${106 - x}%`, top: `${y}%` }
            return (
              <li key={placa.uf}>
                <span className="placa-ponto" style={{ left: `${x}%`, top: `${y}%` }} />
                <Link
                  href={`/estado/${placa.uf.toLowerCase()}`}
                  className={terra ? 'placa placa-alternavel' : 'placa'}
                  aria-label={rotuloDaPlaca(placa)}
                  style={posicao}
                >
                  <PlacaConteudo placa={placa} />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="lista-placas">
        <h2>Estoque nos estados que publicam</h2>
        <ul>
          {placas.map((placa) => (
            <li key={placa.uf}>
              <Link href={`/estado/${placa.uf.toLowerCase()}`} aria-label={rotuloDaPlaca(placa)}>
                <PlacaConteudo placa={placa} />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <figcaption className="legenda-mapa">
        <div className="legenda-grupo legenda-coletas">
          <strong>Coletas de sangue por mil habitantes{ano ? `, ${ano}` : ''}</strong>
          <ul className="legenda-itens">
            {LIMITES_FAIXAS.map((limite, i) => (
              <li key={limite}>
                <span className="amostra amostra-faixa" style={{ background: `var(--faixa-${i})` }} />
                {i === 0 ? `até ${limite}` : `${LIMITES_FAIXAS[i - 1]} a ${limite}`}
              </li>
            ))}
            <li>
              <span className="amostra amostra-faixa" style={{ background: 'var(--faixa-4)' }} />
              {LIMITES_FAIXAS.at(-1)} ou mais
            </li>
            <li>
              <span className="amostra amostra-hachura" />
              envio incompleto à Anvisa
            </li>
          </ul>
        </div>
        <div className="legenda-grupo">
          <strong>Estoque de hoje</strong>
          <ul className="legenda-itens">
            {NIVEIS_ESTOQUE.map((nivel) => (
              <li key={nivel} className={`nivel-${nivel}`}>
                <span className="amostra" />
                {ROTULOS_NIVEL[nivel]}
              </li>
            ))}
            <li className="legenda-estoque-tipo">
              <span className="amostra amostra-sem-estoque" />
              não publica o estoque
            </li>
            <li className="legenda-coletas">nas placas, na ordem A+ A- B+ B- AB+ AB- O+ O-</li>
          </ul>
        </div>
      </figcaption>
    </figure>
  )
}
