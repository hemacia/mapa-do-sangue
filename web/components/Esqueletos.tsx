// Um esqueleto por tela, com a mesma grade da página que ele substitui: enquanto os dados chegam,
// a tela já tem o desenho certo e o rodapé não sobe para o meio.
import type { CSSProperties } from 'react'

function Bloco({
  largura = '100%',
  altura = 16,
  className = '',
}: {
  largura?: string
  altura?: number
  className?: string
}) {
  return <span className={`esq ${className}`} style={{ width: largura, height: altura } as CSSProperties} />
}

function Carregando({ texto }: { texto: string }) {
  return (
    <span role="status" className="visualmente-oculto">
      {texto}
    </span>
  )
}

function OitoTipos({ altura = 30 }: { altura?: number }) {
  return (
    <span className="esq-tipos">
      {Array.from({ length: 8 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: os oito quadrados são fixos
        <Bloco key={i} altura={altura} />
      ))}
    </span>
  )
}

function CartaoVazio() {
  return (
    <div className="esq-cartao">
      <Bloco largura="55%" altura={18} />
      <OitoTipos />
      <Bloco largura="80%" altura={12} />
    </div>
  )
}

// Conteúdo da grade de três colunas do início (o .inicio já vem da página).
export function EsqueletoInicioConteudo() {
  return (
    <>
      <div className="manchete-painel esq-escuro" aria-hidden="true">
        <Bloco largura="40%" altura={56} />
        <Bloco largura="90%" altura={56} />
        <Bloco largura="75%" altura={56} />
        <Bloco largura="85%" altura={14} />
        <span className="esq-linha">
          <Bloco largura="130px" altura={48} />
          <Bloco largura="160px" altura={48} />
        </span>
        {Array.from({ length: 8 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: as oito barras são fixas
          <span key={i} className="esq-linha">
            <Bloco largura="36px" altura={18} />
            <Bloco altura={10} />
          </span>
        ))}
      </div>
      <div className="palco esq-escuro esq-palco" aria-hidden="true">
        <span className="esq-linha">
          <Bloco largura="170px" altura={44} />
          <Bloco largura="60%" altura={44} />
        </span>
        <Bloco className="esq-mapa" />
      </div>
      <div className="painel-hemocentros" aria-hidden="true">
        <Bloco largura="70%" altura={28} />
        <Bloco largura="85%" altura={14} />
        {Array.from({ length: 4 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: cartões de enfeite
          <CartaoVazio key={i} />
        ))}
      </div>
      <Carregando texto="Carregando o estoque" />
    </>
  )
}

export function EsqueletoInicio() {
  return (
    <div className="inicio esq-tela">
      <EsqueletoInicioConteudo />
    </div>
  )
}

export function EsqueletoEstado() {
  return (
    <div className="esq-tela">
      <section className="faixa-casco" aria-hidden="true">
        <div className="faixa-casco-conteudo">
          <div className="faixa-casco-texto esq-escuro">
            <Bloco largura="140px" altura={14} />
            <Bloco largura="80%" altura={56} />
            <Bloco largura="65%" altura={18} />
            <Bloco largura="420px" altura={56} />
            <Bloco largura="130px" altura={48} />
          </div>
          <span className="esq-escuro">
            <Bloco largura="240px" altura={240} className="esq-mapa-pequeno" />
          </span>
        </div>
      </section>
      <div className="pagina" aria-hidden="true">
        <Bloco largura="45%" altura={30} />
        <span className="esq-tipos esq-tipos-grandes">
          {Array.from({ length: 8 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: os oito blocos são fixos
            <Bloco key={i} altura={112} />
          ))}
        </span>
        <Bloco altura={160} />
      </div>
      <Carregando texto="Carregando o estado" />
    </div>
  )
}

// Só a lista: o título da página de hemocentros é estático e já aparece.
export function EsqueletoHemocentros() {
  return (
    <div className="esq-tela-curta">
      {Array.from({ length: 2 }, (_, grupo) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: grupos de enfeite
        <div key={grupo} className="secao" aria-hidden="true">
          <Bloco largura="220px" altura={30} />
          <div className="hemocentros-grade">
            {Array.from({ length: 3 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: cartões de enfeite
              <div key={i} className="esq-cartao esq-cartao-caixa">
                <Bloco largura="55%" altura={18} />
                <OitoTipos />
                <Bloco largura="80%" altura={12} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Carregando texto="Carregando os hemocentros" />
    </div>
  )
}

export function EsqueletoPaginaHemocentros() {
  return (
    <div className="pagina esq-tela">
      <div className="cabecalho" aria-hidden="true">
        <Bloco largura="320px" altura={56} />
        <Bloco largura="70%" altura={18} />
      </div>
      <EsqueletoHemocentros />
    </div>
  )
}

export function EsqueletoPossoDoar() {
  return (
    <div className="pagina esq-tela">
      <div className="cabecalho" aria-hidden="true">
        <Bloco largura="420px" altura={56} />
        <Bloco largura="75%" altura={18} />
      </div>
      <div className="posso-doar" aria-hidden="true">
        <div className="formulario caixa">
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: campos de enfeite
            <span key={i} className="esq-campo">
              <Bloco largura="40%" altura={14} />
              <Bloco altura={44} />
            </span>
          ))}
          <Bloco largura="120px" altura={48} />
        </div>
        <div className="resultado esq-escuro">
          <Bloco largura="70%" altura={44} />
          <Bloco altura={14} />
          <Bloco largura="80%" altura={14} />
        </div>
      </div>
      <Carregando texto="Carregando o formulário" />
    </div>
  )
}

export function EsqueletoSobre() {
  return (
    <div className="pagina esq-tela">
      <div className="cabecalho" aria-hidden="true">
        <Bloco largura="360px" altura={56} />
        <Bloco largura="80%" altura={18} />
        <Bloco largura="60%" altura={18} />
      </div>
      <div className="secao" aria-hidden="true">
        <Bloco largura="260px" altura={30} />
        <span className="esq-tipos esq-tipos-quatro">
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: os quatro níveis são fixos
            <Bloco key={i} altura={96} />
          ))}
        </span>
        <Bloco altura={260} />
      </div>
      <Carregando texto="Carregando a página" />
    </div>
  )
}

export function EsqueletoHistorico() {
  return (
    <div className="esq-tela">
      <section className="faixa-casco" aria-hidden="true">
        <div className="faixa-casco-conteudo">
          <div className="faixa-casco-texto esq-escuro">
            <Bloco largura="70%" altura={56} />
            <Bloco largura="85%" altura={18} />
            <Bloco largura="520px" altura={56} />
          </div>
        </div>
      </section>
      <div className="pagina" aria-hidden="true">
        <Bloco largura="40%" altura={30} />
        <Bloco altura={300} />
        <Bloco largura="30%" altura={30} />
        <Bloco altura={420} />
      </div>
      <Carregando texto="Carregando o histórico" />
    </div>
  )
}
