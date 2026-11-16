import Link from 'next/link'
import { faixaDeColetas } from '@/lib/domain/estatisticas'
import type { LinhaEstado } from '@/lib/domain/historico'
import { NOMES_UF, type UF } from '@/lib/domain/ufs'

const taxa = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

// Estado × ano na mesma escala azul do mapa. É uma tabela: o leitor de tela lê o número de cada
// célula; quem vê lê a cor, e o número aparece no title e na última coluna.
export function MapaDeCalor({ anos, linhas }: { anos: number[]; linhas: LinhaEstado[] }) {
  return (
    <div className="calor-rolagem">
      <table className="calor">
        <caption className="visualmente-oculto">
          Coletas de sangue por mil habitantes em cada estado, por ano
        </caption>
        <thead>
          <tr>
            <th scope="col">Estado</th>
            {anos.map((ano) => (
              <th key={ano} scope="col">
                <abbr title={String(ano)}>{String(ano).slice(2)}</abbr>
              </th>
            ))}
            <th scope="col" className="calor-ultimo">
              {anos.at(-1)}
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.uf}>
              <th scope="row">
                <Link href={`/estado/${linha.uf.toLowerCase()}`}>{NOMES_UF[linha.uf as UF]}</Link>
              </th>
              {linha.anos.map(({ ano, porMil, incompleto }) => {
                const faixa = faixaDeColetas(
                  porMil,
                  incompleto ? 'incompleto' : porMil === null ? 'sem-dado' : 'completo',
                )
                const texto =
                  porMil === null
                    ? 'sem dado'
                    : incompleto
                      ? `${taxa(porMil)}, envio incompleto`
                      : taxa(porMil)
                return (
                  <td
                    key={ano}
                    className={
                      faixa === null ? 'calor-vazio' : faixa === 'incompleto' ? 'calor-incompleto' : undefined
                    }
                    style={typeof faixa === 'number' ? { background: `var(--faixa-${faixa})` } : undefined}
                    title={`${NOMES_UF[linha.uf as UF]}, ${ano}: ${texto}`}
                  >
                    <span className="visualmente-oculto">{texto}</span>
                  </td>
                )
              })}
              <td className="calor-ultimo">{linha.ultimo === null ? '–' : taxa(linha.ultimo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
