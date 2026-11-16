import type { DiaEstoque } from '@/lib/api/cliente'
import { ROTULOS_NIVEL } from '@/lib/domain/nivel'
import { TIPOS_SANGUINEOS } from '@/lib/domain/tipos'

const MINIMO_DE_DIAS = 5
const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })

// Tabela tipo × dia, cada célula na cor do nível. É uma tabela de verdade: o leitor de tela lê o
// nível de cada célula, e quem não distingue as cores tem a legenda e o nome no title.
export function EstoqueDiaADia({ dias, id }: { dias: DiaEstoque[]; id: string }) {
  if (dias.length < MINIMO_DE_DIAS) return null
  const datas = dias.map((d) => dia.format(new Date(d.data)))
  return (
    <div className="caixa secao">
      <h3 id={`dia-a-dia-${id}`} className="titulo" style={{ fontSize: 'var(--text-xl)' }}>
        Dia a dia
      </h3>
      <p className="nota">
        Nível de cada tipo na última leitura de cada dia, de {datas[0]} a {datas.at(-1)}. Dias sem leitura
        ficam de fora.
      </p>
      <div className="dia-a-dia-rolagem">
        <table className="dia-a-dia" aria-labelledby={`dia-a-dia-${id}`}>
          <thead>
            <tr>
              <th scope="col">
                <span className="visualmente-oculto">Tipo</span>
              </th>
              {datas.map((d) => (
                <th key={d} scope="col">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIPOS_SANGUINEOS.map((tipo) => (
              <tr key={tipo}>
                <th scope="row">{tipo}</th>
                {dias.map((d, i) => {
                  const nivel = d.estoque[tipo]
                  const rotulo = nivel ? ROTULOS_NIVEL[nivel] : 'Sem dado'
                  return (
                    <td
                      key={d.data}
                      className={`nivel-${nivel ?? 'sem-dado'}`}
                      title={`${tipo} em ${datas[i]}: ${rotulo}`}
                    >
                      <span className="visualmente-oculto">{rotulo}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
