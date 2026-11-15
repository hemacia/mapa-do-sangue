import type { Metadata } from 'next'
import { LIMITES_FAIXAS } from '@/lib/domain/estatisticas'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Sobre os dados',
  description: 'De onde vêm os dados do Mapa do Sangue e como os níveis de cada hemocentro são comparados.',
  alternates: { canonical: '/sobre' },
}

const NIVEIS = [
  ['critico', 'Crítico', 'O nível mais baixo da escala do hemocentro.'],
  ['alerta', 'Alerta', 'Abaixo do ideal, um degrau acima do crítico.'],
  ['estavel', 'Estável', 'Estoque regular.'],
  ['adequado', 'Adequado', 'O melhor nível da escala.'],
]

const FONTES = [
  ['HEMOES', 'Espírito Santo', 'API de dados abertos do governo do ES', 'Nada: já usa a escala comum'],
  ['Hemopi', 'Piauí', 'Endpoint JSON do site', 'Plaquetas ficam de fora'],
  ['Hemominas', 'Minas Gerais', 'Página do site', '"Estável" é o melhor nível lá e vira Adequado'],
  ['Hemocentro Unicamp', 'São Paulo', 'Página do site, nível no nome da imagem', 'Nada'],
  ['Hemosc', 'Santa Catarina', 'Página do site', '"Alerta" é o pior nível lá e vira Crítico'],
  ['Hemoba', 'Bahia', 'Página do site', 'A página não informa a data da atualização'],
  [
    'Pró-Sangue',
    'São Paulo (capital)',
    'Bolsas por tipo escritas no código da página',
    'O nível sai dos limites da própria página; ela não informa a data',
  ],
  [
    'Hemocentro RP',
    'São Paulo (Ribeirão Preto, Araçatuba, Fernandópolis, Presidente Prudente e Taubaté)',
    'Gráfico do Google Planilhas com bolsas e mínimo de segurança',
    'Abaixo do mínimo é Crítico; até 1,5 vez, Alerta; até 2 vezes, Estável; acima, Adequado',
  ],
  [
    'Hemosul',
    'Mato Grosso do Sul',
    'Painel Qlik com bolsas e estoque estratégico',
    'O painel não mostra o excesso: quem atinge o estratégico vira Estável',
  ],
]

export default function PaginaSobre() {
  return (
    <div className="pagina">
      <div className="cabecalho">
        <h1>Sobre os dados</h1>
        <p>
          Poucos hemocentros publicam o estoque, e cada um usa uma escala diferente. O Mapa do Sangue lê as
          páginas oficiais duas vezes por dia, às 9h e às 15h, traduz cada escala para quatro níveis e guarda
          o histórico.
        </p>
      </div>

      <section className="secao" aria-labelledby="niveis">
        <h2 id="niveis">Os quatro níveis</h2>
        <ul className="niveis">
          {NIVEIS.map(([nivel, nome, descricao]) => (
            <li key={nivel} className={`nivel-${nivel}`}>
              <strong>{nome}</strong>
              <p>{descricao}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="secao" aria-labelledby="fontes">
        <h2 id="fontes">De onde vem cada estoque</h2>
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th scope="col">Hemocentro</th>
                <th scope="col">Estado</th>
                <th scope="col">Como publica</th>
                <th scope="col">O que muda na tradução</th>
              </tr>
            </thead>
            <tbody>
              {FONTES.map(([nome, estado, como, traducao]) => (
                <tr key={nome}>
                  <th scope="row">{nome}</th>
                  <td>{estado}</td>
                  <td>{como}</td>
                  <td>{traducao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="nota">
          Os outros 20 estados não publicam o estoque de um jeito que dê para ler automaticamente. O IHEBE,
          banco de sangue privado de Belém, mostra percentuais no site, mas eles são os mesmos desde janeiro
          de 2025 e por isso ficam de fora.
        </p>
      </section>

      <div className="duas-colunas">
        <section className="secao" aria-labelledby="anvisa">
          <h2 id="anvisa">Coletas por mil habitantes</h2>
          <p>
            A cor de fundo dos estados no mapa vem do Hemoprod 2025, da Anvisa: o total de coletas de sangue
            total e por aférese dividido pela população estimada pelo IBGE. As faixas do mapa mudam a cada{' '}
            {LIMITES_FAIXAS[1] - LIMITES_FAIXAS[0]} coletas, de até {LIMITES_FAIXAS[0]} a{' '}
            {LIMITES_FAIXAS.at(-1)} ou mais.
          </p>
          <p className="nota">
            Abaixo de 5 por mil, o estado quase certamente não mandou todos os dados. Nesse caso o mapa mostra
            listras e o texto “envio incompleto”, em vez do número.
          </p>
        </section>
        <section className="secao" aria-labelledby="projeto">
          <h2 id="projeto">O projeto</h2>
          <p>
            Código aberto, feito para a disciplina de Teste de Software da UFMG. O site não guarda nome,
            e-mail nem nenhum dado pessoal.
          </p>
          <a href={SITE.repositorio} className="botao botao-escuro" style={{ alignSelf: 'flex-start' }}>
            Ver o código no GitHub
          </a>
        </section>
      </div>
    </div>
  )
}
