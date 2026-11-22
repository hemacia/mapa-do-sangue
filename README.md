# Mapa do Sangue

[![CI](https://github.com/hemacia/mapa-do-sangue/actions/workflows/ci.yml/badge.svg)](https://github.com/hemacia/mapa-do-sangue/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/hemacia/mapa-do-sangue/graph/badge.svg)](https://codecov.io/gh/hemacia/mapa-do-sangue)

Mapa aberto do estoque de sangue dos hemocentros do Brasil: quais tipos estão em falta, quais estão estáveis, estatísticas por estado e ferramentas para incentivar a doação.

**No ar:** [mapa-do-sangue.vercel.app](https://mapa-do-sangue.vercel.app) · API: [mapa-do-sangue-api.onrender.com](https://mapa-do-sangue-api.onrender.com/healthz)

## Integrantes

- Ítalo Dell Areti
- Milena Corrêa Moreira

## Sobre o sistema

Poucos hemocentros publicam o estoque de forma organizada, e cada um usa uma escala diferente. O Mapa do Sangue junta essas informações num lugar só e guarda o histórico, que hoje quase nenhum hemocentro disponibiliza.

Funcionalidades:

- **Mapa de estoque**: nível de cada tipo sanguíneo nos hemocentros que publicam, coletado duas vezes por dia. Clicar num estado abre um resumo com o link para a página dele
- **Página de cada estado**: estoque de cada hemocentro (com bolsas e mínimo quando a fonte informa), estoque dia a dia, onde doar (unidades do CNES), quem doa no estado, coletas por ano desde 2010 e alerta noticiado quando o site oficial fala de estoque baixo
- **Hemocentros**: todos os hemocentros que publicam o estoque, separados por estado
- **Histórico**: coletas no Brasil e em cada estado de 2010 até hoje (Anvisa Hemoprod), o ano em andamento comparado ao anterior e um mapa de calor por estado
- **Posso doar?**: verifica idade, peso e intervalo desde a última doação pelas regras da Portaria GM/MS nº 11.685/2026 (em vigor desde 30/09/2026) e informa a próxima data em que a pessoa pode doar
- **Quem doa para quem**: compatibilidade de hemácias entre os oito tipos ABO/Rh
- **Eu doei hoje!**: registra a doação (só estado e tipo, sem dado pessoal) e mostra quantas doações foram registradas no dia e no mês

### Fontes de estoque

| Hemocentro | Estado | Como o dado é publicado |
|---|---|---|
| HEMOES | ES | API de dados abertos do governo do ES (também guardamos os dias antigos que o portal mostra) |
| Hemopi | PI | Endpoint JSON do site |
| Hemominas | MG | Página do site (escala própria: "Estável" é o melhor nível) |
| Hemocentro Unicamp | SP | Página do site (nível no nome da imagem) |
| Pró-Sangue | SP | Bolsas por tipo no código da página, com os limites da própria página |
| Hemocentro de Ribeirão Preto | SP | Gráficos do Google Planilhas com bolsas e mínimo de segurança em 5 cidades |
| Hemosc | SC | Página do site em ISO-8859-1 (escala própria: "Alerta" é o pior nível) |
| Hemoba | BA | Página do site |
| Hemosul | MS | Painel Qlik Sense, lido pela Engine API |
| Hemoacre | AC | Home do portal do governo do Acre |
| MT-Hemocentro | MT | Página pública do agendamento (nível no nome da imagem) |
| Fundação Hemocentro de Brasília | DF | Imagem diária, lida pela altura do vermelho em cada gota |

Os outros 17 estados não publicam o estoque de forma que dê para coletar. Para eles o site mostra os dados da Anvisa, as unidades de hemoterapia do CNES e, em 11 estados, as notícias de estoque baixo dos sites oficiais. A pesquisa que embasou o projeto (fontes por estado, regras de doação, projetos parecidos) está em [docs/pesquisa](docs/pesquisa/).

## Tecnologias

A arquitetura completa está em [docs/design](docs/design/).

- **Next.js + TypeScript** (`web/`): site com as páginas geradas no servidor (SEO), mapa em SVG desenhado com `d3-geo` a partir da malha do IBGE e cliente da API tipado pelo contrato OpenAPI. As regras de negócio ficam em `web/lib/domain` como funções puras, separadas da tela, o que facilita testar
- **Go** (`net/http`, `pgx`, em `api/`): API HTTP com contrato OpenAPI (`oapi-codegen`), erros no formato RFC 9457, CORS, cabeçalhos de segurança e limite de requisições
- **PostgreSQL**: banco com migrations versionadas (`goose`)
- **Coletor em Go** (`api/cmd/coletor`, `goquery`): baixa as 16 fontes de estoque de 10 estados ao mesmo tempo (páginas, JSON, gráficos do Google, um painel Qlik e a imagem diária do DF, lida pela cor) e grava as leituras numa transação. Uma fonte fora do ar não impede as outras. Também lê as notícias de estoque baixo de 11 estados sem estoque publicado
- **Docker Compose**: ambiente local e testes de integração; imagem da API `distroless`
- **Vitest + Testing Library**: testes de unidade e de componentes, com cobertura mínima de 80% configurada
- **Stryker**: teste de mutação nas regras de domínio do site, com mutation score mínimo de 90% configurado
- **Playwright**: testes end-to-end no navegador, contra a API e o banco em Docker
- **Biome, golangci-lint e lefthook**: lint, formatação e padrão Conventional Commits verificados antes do commit
- **GitHub Actions + Codecov**: CI em Linux, macOS e Windows a cada commit, com relatório de cobertura publicado no Codecov
- **Vercel, Render e Neon** (planos gratuitos): o site fica na Vercel, a API em Docker no Render (configurada em `render.yaml`) e o PostgreSQL no Neon. A coleta e a atualização da Anvisa rodam no GitHub Actions e gravam direto no banco de produção. No plano gratuito a API dorme após 15 minutos sem uso; as páginas do site ficam em cache, então só a primeira chamada depois disso demora
- **Dependabot**: atualização semanal das dependências, das imagens Docker e das actions

## Uso de IA

Usamos o **Claude Code** (Anthropic) em duas frentes:

- **Pesquisa de viabilidade**: levantamento de como cada um dos 27 estados publica o estoque de sangue, das bases nacionais (Anvisa, CNES, IBGE), das regras de doação vigentes e de projetos open source parecidos. Todas as fontes foram verificadas nos sites oficiais e estão citadas em [docs/pesquisa](docs/pesquisa/)
- **Apoio na implementação**: escrita dos testes e do código em ciclos de TDD, configuração do CI e revisão. Todo o código foi revisado e as decisões foram tomadas pelo grupo

## Como executar

Requer Docker, Node.js 22.13 ou superior (a versão usada no CI está em `.nvmrc`) e Go (a versão está em `api/go.mod`). `make help` lista todos os comandos.

```bash
# 1. configuração local (senhas de exemplo, só para a sua máquina)
cp .env.example .env

# 2. banco e API em Docker, com recarga automática (http://localhost:8080/healthz)
make dev

# 3. em outro terminal: coleta o estoque de verdade agora e grava no banco
make carregar-coleta

# 4. site em http://localhost:3000
cd web && npm ci && cd ..
make web
```

As estatísticas da Anvisa (2010 em diante) e as unidades do CNES entram no banco pelas migrations, na primeira vez que a API sobe. Se a porta 8080 estiver ocupada, troque `API_PORT` no `.env` e crie `web/.env.local` com `API_URL` e `NEXT_PUBLIC_API_URL` apontando para a nova porta.

## Execução dos testes

Os requisitos são os mesmos de [Como executar](#como-executar).

### Site (Next.js, em `web/`)

```bash
cd web && npm ci && cd ..

# testes de unidade e de componentes, com cobertura (web/coverage)
cd web && npm run test:coverage && cd ..

# teste de mutação das regras de domínio (web/lib/domain), relatório em web/reports/mutation
cd web && npm run test:mutation && cd ..

# e2e: sobe API e Postgres em Docker com dados fixos, faz o build do site e roda o Playwright
# (na primeira vez: cd web && npx playwright install chromium)
make test-e2e-web
```

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

Os testes do coletor rodam junto com os da API (`make test-api`). Cada leitor é testado com a página real salva em `api/internal/coleta/testdata`, então nenhum teste acessa a internet.

```bash
# coleta o estoque de verdade agora e grava no Postgres local
make carregar-coleta

# atualiza as estatísticas pelo CSV nacional da Anvisa (o GitHub Actions roda isto todo mês)
cd api && DATABASE_URL=postgres://mapa:mapa@localhost:5439/mapa?sslmode=disable go run ./cmd/coletor -anvisa

# regenera as migrations de estatísticas (planilhas antigas e CSV da Anvisa) e do CNES
cd api && go run ./cmd/estatisticas -saida migrations/<arquivo>.sql -csv hemoprod_nacional.csv -anos 2022,2023 bd-hemoprod-*.xlsx
cd api && go run ./cmd/cnes migrations/<arquivo>.sql
```

### Boas práticas adotadas nos testes

- **TDD**: cada regra começou por um teste falhando, visível no histórico de commits (`test:` seguido de `feat:`)
- **Arrange, Act, Assert** em cada teste, com linhas em branco separando as etapas
- **FIRST**: testes rápidos, independentes entre si, repetíveis (nenhum depende do relógio, do fuso da máquina ou da internet: a data de "hoje" é injetada e os testes rodam em UTC), autoverificáveis e escritos junto com o código
- **Teste de mutação**: o Stryker altera o código das regras de domínio (troca `<` por `<=`, apaga condições, esvazia textos) e confere se algum teste falha. O mutation score de `web/lib/domain` é de **98%**: os mutantes que sobrevivem são equivalentes, ou seja, mudam o código sem mudar o comportamento. Foi o teste de mutação que mostrou que alguns testes passavam só porque a máquina estava no fuso de Brasília
- Testes pela API pública dos módulos e com nomes que descrevem o comportamento esperado

## Licença

[MIT](LICENSE)
