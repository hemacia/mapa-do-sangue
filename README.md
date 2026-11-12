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

A arquitetura completa está em [docs/design](docs/design/).

- **Next.js + TypeScript** (`web/`): site com as páginas geradas no servidor (SEO), mapa em SVG desenhado com `d3-geo` a partir da malha do IBGE e cliente da API tipado pelo contrato OpenAPI. As regras de negócio ficam em `web/lib/domain` como funções puras, separadas da tela, o que facilita testar
- **Go** (`net/http`, `pgx`, em `api/`): API HTTP com contrato OpenAPI (`oapi-codegen`), erros no formato RFC 9457, CORS, cabeçalhos de segurança e limite de requisições
- **PostgreSQL**: banco com migrations versionadas (`goose`)
- **Coletor em TypeScript** (`src/coleta`): lê as seis fontes e gera o SQL das leituras (será portado para Go)
- **Docker Compose**: ambiente local e testes de integração; imagem da API `distroless`
- **Vitest + Testing Library**: testes de unidade e de componentes, com cobertura mínima de 80% configurada
- **Playwright**: testes end-to-end no navegador, contra a API e o banco em Docker
- **Biome, golangci-lint e lefthook**: lint, formatação e padrão Conventional Commits verificados antes do commit
- **GitHub Actions + Codecov**: CI em Linux, macOS e Windows a cada commit, com relatório de cobertura publicado no Codecov
- **Dependabot**: atualização semanal das dependências, das imagens Docker e das actions

## Uso de IA

Usamos o **Claude Code** (Anthropic) em duas frentes:

- **Pesquisa de viabilidade**: levantamento de como cada um dos 27 estados publica o estoque de sangue, das bases nacionais (Anvisa, CNES, IBGE), das regras de doação vigentes e de projetos open source parecidos. Todas as fontes foram verificadas nos sites oficiais e estão citadas em [docs/pesquisa](docs/pesquisa/)
- **Apoio na implementação**: escrita dos testes e do código em ciclos de TDD, configuração do CI e revisão. Todo o código foi revisado e as decisões foram tomadas pelo grupo

## Execução dos testes

Requer Node.js 22.13 ou superior (a versão usada no CI está em `.nvmrc`), Go (a versão está em `api/go.mod`) e Docker. `make help` lista todos os comandos.

### Site (Next.js, em `web/`)

```bash
cd web && npm ci && cd ..

# testes de unidade e de componentes, com cobertura (web/coverage)
cd web && npm run test:coverage && cd ..

# e2e: sobe API e Postgres em Docker com dados fixos, faz o build do site e roda o Playwright
# (na primeira vez: cd web && npx playwright install chromium)
make test-e2e-web
```

Para ver o site com dados de verdade: `make dev` (API e banco), `make carregar-coleta` (coleta o estoque agora e grava no banco) e `make web` (site em http://localhost:3000). Se a porta 8080 estiver ocupada, troque `API_PORT` no `.env` e aponte `API_URL` e `NEXT_PUBLIC_API_URL` em `web/.env.local` para ela.

### API (Go + PostgreSQL)

```bash
cp .env.example .env

# API e banco locais com recarga automática (http://localhost:8080/healthz)
make dev

# testes da API: os de banco rodam contra o Postgres do compose
make db
DATABASE_URL_TEST=postgres://mapa:mapa@localhost:5439/mapa?sslmode=disable make test-api

# ou tudo em Docker, com um Postgres limpo
make test-api-docker
```

Cada teste de banco cria um schema próprio, aplica as migrations e apaga o schema no fim, então os testes não dependem um do outro. O contrato da API está em `api/openapi.yaml`, e o servidor Go é gerado dele (`make generate`).

### Coletor

```bash
npm ci

# testes dos leitores de cada fonte, com as páginas salvas em tests/fixtures (nenhum teste acessa a internet)
npm run test:coverage
```

### Boas práticas adotadas nos testes

- **TDD**: cada regra começou por um teste falhando, visível no histórico de commits (`test:` seguido de `feat:`)
- **Arrange, Act, Assert** em cada teste, com linhas em branco separando as etapas
- **FIRST**: testes rápidos, independentes entre si, repetíveis (nenhum depende do relógio ou da internet: a data de "hoje" é injetada), autoverificáveis e escritos junto com o código
- Testes pela API pública dos módulos e com nomes que descrevem o comportamento esperado

## Licença

[MIT](LICENSE)
