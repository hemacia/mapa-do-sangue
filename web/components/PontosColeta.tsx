import type { PontoColeta } from '@/lib/api/cliente'
import { CAPITAIS, noEstado, type UF } from '@/lib/domain/ufs'

const CIDADES_ABERTAS = 6
const UNIDADES_ABERTAS = 5

function porCidade(pontos: PontoColeta[], capital: string) {
  const grupos = new Map<string, PontoColeta[]>()
  for (const p of pontos) {
    const cidade = p.cidade ?? 'Cidade não informada'
    grupos.set(cidade, [...(grupos.get(cidade) ?? []), p])
  }
  // A capital primeiro; depois as cidades com mais unidades, que costumam ser os polos regionais.
  return [...grupos].sort(
    (a, b) =>
      Number(b[0] === capital) - Number(a[0] === capital) ||
      b[1].length - a[1].length ||
      a[0].localeCompare(b[0], 'pt-BR'),
  )
}

function Unidades({ pontos }: { pontos: PontoColeta[] }) {
  return (
    <ul>
      {pontos.map((p) => (
        <li key={p.cnes}>
          <strong>{p.nome}</strong>
          {p.publico && <span className="etiqueta-publico">Público</span>}
          {p.endereco && (
            <p>
              {p.endereco}
              {p.bairro && `, ${p.bairro}`}
            </p>
          )}
          <p className="pontos-acoes">
            {p.telefone && <a href={`tel:${p.telefone.replace(/[^\d]/g, '')}`}>{p.telefone}</a>}
            <a
              href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=17/${p.latitude}/${p.longitude}`}
            >
              Ver no mapa
            </a>
          </p>
        </li>
      ))}
    </ul>
  )
}

// A API já manda as públicas primeiro dentro de cada cidade.
function Cidade({ cidade, pontos }: { cidade: string; pontos: PontoColeta[] }) {
  const resto = pontos.slice(UNIDADES_ABERTAS)
  return (
    <section className="pontos-cidade">
      <h3>{cidade}</h3>
      <Unidades pontos={pontos.slice(0, UNIDADES_ABERTAS)} />
      {resto.length > 0 && (
        <details className="pontos-mais">
          <summary>
            Mais {resto.length} {resto.length === 1 ? 'unidade' : 'unidades'} em {cidade}
          </summary>
          <Unidades pontos={resto} />
        </details>
      )}
    </section>
  )
}

export function PontosColeta({ uf, pontos }: { uf: UF; pontos: PontoColeta[] }) {
  if (pontos.length === 0) return null
  const cidades = porCidade(pontos, CAPITAIS[uf])
  const abertas = cidades.slice(0, CIDADES_ABERTAS)
  const resto = cidades.slice(CIDADES_ABERTAS)
  return (
    <section className="secao" aria-labelledby="onde-doar">
      <div className="cabecalho">
        <h2 id="onde-doar">Onde doar {noEstado(uf)}</h2>
        <p className="nota">
          {pontos.length} {pontos.length === 1 ? 'unidade' : 'unidades'} de hemoterapia em {cidades.length}{' '}
          {cidades.length === 1 ? 'cidade' : 'cidades'}, pelo cadastro do Ministério da Saúde (CNES). Nem toda
          unidade atende quem chega de fora: ligue antes de ir.
        </p>
      </div>
      <div className="pontos-cidades">
        {abertas.map(([cidade, lista]) => (
          <Cidade key={cidade} cidade={cidade} pontos={lista} />
        ))}
      </div>
      {resto.length > 0 && (
        <details className="pontos-mais">
          <summary>
            Mais {resto.length} {resto.length === 1 ? 'cidade' : 'cidades'}
          </summary>
          <div className="pontos-cidades">
            {resto.map(([cidade, lista]) => (
              <Cidade key={cidade} cidade={cidade} pontos={lista} />
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
