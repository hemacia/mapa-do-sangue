import type { EstatisticaUF } from '@/lib/api/cliente'
import { montarPerfil, variacaoDasColetas } from '@/lib/domain/perfil'
import { noEstado, type UF } from '@/lib/domain/ufs'

const numero = (n: number) => n.toLocaleString('pt-BR')

// titulo troca o "Quem doa no estado" quando o perfil é do Brasil inteiro.
export function PerfilDoadores({
  uf,
  estatistica,
  titulo,
}: {
  uf?: UF
  estatistica?: EstatisticaUF
  titulo?: string
}) {
  const perfil = montarPerfil(estatistica?.indicadores)
  const variacao = variacaoDasColetas(estatistica?.serie)
  if (!estatistica || !perfil) return null
  const fatos = [
    [perfil.repeticao, 'já tinham doado antes e voltaram'],
    [perfil.primeiraVez, 'doaram pela primeira vez'],
    [perfil.reposicao, 'doaram para repor o sangue de um paciente conhecido'],
    [perfil.feminino, 'são mulheres'],
    [perfil.ate29, 'têm até 29 anos'],
    [perfil.inaptos, 'dos candidatos não passaram na triagem'],
  ] as const
  return (
    <section className="secao" aria-labelledby="perfil">
      <div className="cabecalho">
        <h2 id="perfil">{titulo ?? `Quem doa ${uf ? noEstado(uf) : 'no Brasil'}`}</h2>
        <p className="nota">
          {numero(perfil.doadores)} doadores aptos em {estatistica.ano}, segundo a Anvisa (Hemoprod).
          {variacao &&
            ` As coletas ${variacao.percentual < 0 ? 'caíram' : 'subiram'} ${Math.abs(variacao.percentual).toLocaleString('pt-BR')}% de ${variacao.de} para ${variacao.para}.`}
        </p>
      </div>
      <dl className="perfil-fatos">
        {fatos.map(([valor, texto]) => (
          <div key={texto}>
            <dt>{texto}</dt>
            <dd>{valor}%</dd>
          </div>
        ))}
      </dl>
      {perfil.tipos && (
        <div className="caixa secao">
          <h3 className="titulo" style={{ fontSize: 'var(--text-xl)' }}>
            Tipo sanguíneo dos doadores
          </h3>
          <ul className="tipos-doadores">
            {perfil.tipos.map(({ tipo, percentual }) => (
              <li key={tipo}>
                <strong>{tipo}</strong>
                <span className="barra" aria-hidden="true">
                  <span style={{ width: `${percentual}%` }} />
                </span>
                <small>{percentual}%</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
