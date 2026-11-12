import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre os dados',
  description: 'De onde vêm os dados do Mapa do Sangue e como os níveis de cada hemocentro são comparados.',
  alternates: { canonical: '/sobre' },
}

const FONTES = [
  ['HEMOES', 'ES', 'API de dados abertos do governo do Espírito Santo'],
  ['Hemopi', 'PI', 'Endpoint JSON do site'],
  ['Hemominas', 'MG', 'Página do site (escala própria: "Estável" é o melhor nível)'],
  ['Hemocentro Unicamp', 'SP', 'Página do site (nível no nome da imagem)'],
  ['Hemosc', 'SC', 'Página do site (escala própria: "Alerta" é o pior nível)'],
  ['Hemoba', 'BA', 'Página do site'],
]

export default function PaginaSobre() {
  return (
    <div className="pagina">
      <div className="cabecalho">
        <h1>Sobre os dados</h1>
        <p>
          Poucos hemocentros publicam o estoque de forma organizada, e cada um usa uma escala diferente. O
          Mapa do Sangue coleta as páginas oficiais duas vezes por dia, traduz cada escala para quatro níveis
          (crítico, alerta, estável e adequado) e guarda o histórico.
        </p>
      </div>
      <h2 className="titulo-secao">Fontes de estoque</h2>
      <ul className="lista">
        {FONTES.map(([nome, uf, como]) => (
          <li key={nome} className="cartao">
            <strong>{nome}</strong> <span className="local">{uf}</span>
            <p className="nota">{como}</p>
          </li>
        ))}
      </ul>
      <p className="nota" style={{ marginTop: 'var(--space-5)' }}>
        Coletas por habitante: Anvisa (Hemoprod) e IBGE. Malha dos estados: IBGE. Os outros estados não
        publicam o estoque de forma que dê para coletar.
      </p>
    </div>
  )
}
