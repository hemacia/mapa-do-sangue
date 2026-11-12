import Link from 'next/link'

export default function NaoEncontrado() {
  return (
    <div className="pagina">
      <div className="cabecalho">
        <h1>Página não encontrada</h1>
        <p>
          O endereço não existe. Volte para o <Link href="/">mapa do estoque</Link>.
        </p>
      </div>
    </div>
  )
}
