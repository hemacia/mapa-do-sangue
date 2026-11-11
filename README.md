# Mapa do Sangue

[![CI](https://github.com/hemacia/mapa-do-sangue/actions/workflows/ci.yml/badge.svg)](https://github.com/hemacia/mapa-do-sangue/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/hemacia/mapa-do-sangue/graph/badge.svg)](https://codecov.io/gh/hemacia/mapa-do-sangue)

Mapa aberto do estoque de sangue dos hemocentros do Brasil: quais tipos estão em falta, quais estão estáveis, estatísticas por estado e ferramentas para incentivar a doação.

## Integrantes

- Ítalo Dell Areti
- Milena Corrêa Moreira

## Sobre o sistema

Poucos hemocentros publicam o estoque de forma organizada, e cada um usa uma escala diferente. O Mapa do Sangue junta essas informações num lugar só e guarda o histórico, que hoje quase nenhum hemocentro disponibiliza.

Funcionalidades:

- **Posso doar?**: verifica idade, peso e intervalo desde a última doação pelas regras da Portaria GM/MS nº 11.685/2026 (em vigor desde 30/09/2026) e informa a próxima data em que a pessoa pode doar
- **Quem doa para quem**: compatibilidade de hemácias entre os oito tipos ABO/Rh
- **Mapa de estoque**: nível de cada tipo sanguíneo por hemocentro, em mapa e em tabela, coletado duas vezes por dia das fontes públicas
- **Eu doei hoje!**: registra a doação (só estado e tipo, sem dado pessoal) e mostra quantas doações foram registradas no mês
- **Estatísticas** _(em desenvolvimento)_: coletas por estado (Anvisa Hemoprod) e histórico de dias em nível crítico

### Fontes de estoque

| Hemocentro | Estado | Como o dado é publicado |
|---|---|---|
| HEMOES | ES | API de dados abertos do governo do ES |
| Hemopi | PI | Endpoint JSON do site |
| Hemominas | MG | Página do site (escala própria: "Estável" é o melhor nível) |
| Hemocentro Unicamp | SP | Página do site (nível no nome da imagem) |
| Hemosc | SC | Página do site em ISO-8859-1 (escala própria: "Alerta" é o pior nível) |
| Hemoba | BA | Página do site |

Os outros estados não publicam o estoque de forma que dê para coletar. A pesquisa que embasou o projeto (fontes por estado, regras de doação, projetos parecidos) está em [docs/pesquisa](docs/pesquisa/).

## Tecnologias

- **Vue 3 + TypeScript + Vite**: interface e regras de negócio. As regras ficam em `src/domain` como funções puras, separadas da tela, o que facilita testar
- **Cloudflare D1 (SQLite)**: banco de dados com os hemocentros, as leituras de estoque e o histórico. O schema está em `migrations/`
- **Cloudflare Pages**: hospedagem gratuita do site
- **Vitest + @vitest/coverage-v8**: testes de unidade e de componentes, com cobertura mínima de 80% configurada
- **Playwright**: testes end-to-end no navegador
- **GitHub Actions + Codecov**: CI em Linux, macOS e Windows a cada commit, com relatório de cobertura publicado no Codecov
- **Dependabot**: atualização semanal das dependências e das actions

## Uso de IA

Usamos o **Claude Code** (Anthropic) em duas frentes:

- **Pesquisa de viabilidade**: levantamento de como cada um dos 27 estados publica o estoque de sangue, das bases nacionais (Anvisa, CNES, IBGE), das regras de doação vigentes e de projetos open source parecidos. Todas as fontes foram verificadas nos sites oficiais e estão citadas em [docs/pesquisa](docs/pesquisa/)
- **Apoio na implementação**: escrita dos testes e do código em ciclos de TDD, configuração do CI e revisão. Todo o código foi revisado e as decisões foram tomadas pelo grupo

## Execução dos testes

Requer Node.js 22.13 ou superior (a versão usada no CI está em `.nvmrc`).

```bash
npm ci

# testes de unidade e de componentes
npm test

# testes de unidade com relatório de cobertura (coverage/index.html)
npm run test:coverage

# testes end-to-end (na primeira vez, instale o navegador)
npx playwright install chromium
npm run test:e2e
```

Os testes e2e sobem o site com as Pages Functions e um banco D1 local, populado com as páginas salvas em `tests/fixtures` (nenhum teste acessa a internet).

Para rodar o site localmente: `npm run dev` (só a interface) ou `node scripts/servidor-e2e.mjs` (interface, API e banco).

Para coletar o estoque de verdade: `npm run coletar` (grava `coleta.sql`).

### Boas práticas adotadas nos testes

- **TDD**: cada regra começou por um teste falhando, visível no histórico de commits (`test:` seguido de `feat:`)
- **Arrange, Act, Assert** em cada teste, com linhas em branco separando as etapas
- **FIRST**: testes rápidos, independentes entre si, repetíveis (nenhum depende do relógio ou da internet: a data de "hoje" é injetada), autoverificáveis e escritos junto com o código
- Testes pela API pública dos módulos e com nomes que descrevem o comportamento esperado

## Licença

[MIT](LICENSE)
