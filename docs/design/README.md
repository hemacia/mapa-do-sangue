# System design

![Arquitetura do Mapa do Sangue](arquitetura.png)

Fonte editável: [arquitetura.src.html](arquitetura.src.html). Para gerar de novo o HTML e o PNG, use a skill `diagrama-system-design`.

## Decisões

| Decisão | Escolha | Por quê | Alternativa descartada |
|---|---|---|---|
| Front | Next.js (App Router) na Vercel | SEO com páginas geradas no servidor e ISR, deploy nativo e gratuito | Vue + Vite (só renderiza no navegador, SEO fraco) |
| API e coleta | Go (`net/http`, `pgx`, `goquery`) | Biblioteca padrão resolve HTTP, testes e cobertura. Compila rápido nos 3 sistemas do CI. Curva menor que Rust para o grupo | Rust (compila devagar no CI e é mais difícil de aprender no prazo) |
| Banco | PostgreSQL na VPS | Um banco só para leituras, histórico e estatísticas. Roda junto da API, sem latência | D1/SQLite (bom, mas a API saiu do Cloudflare) |
| Borda | Cloudflare (plano gratuito) | DNS do domínio, proteção DDoS, WAF e cache. O Tunnel liga a VPS sem abrir porta | Expor a VPS direto (porta aberta, sem proteção) |
| Servidor | VPS com Docker Compose | API, coletor e Postgres juntos, custo previsível | Render gratuito (dorme após 15 min) |
| Backup | `pg_dump` diário para Cloudflare R2 | 10 GB grátis, sem custo de saída | Sem backup |

### Atenção ao enunciado do TP

O TP pede deploy em "plataforma de nuvem com plano gratuito". O site (Next.js) fica na Vercel, que é gratuita. Para a VPS da API seguir a mesma regra, a sugestão é a **Oracle Cloud Always Free** (VPS ARM gratuita sem prazo). Uma VPS paga (Hetzner, Contabo) pode entrar depois, sem mudar nada no código, porque tudo roda em Docker Compose.

## Estrutura do repositório

```
mapa-do-sangue/
├── web/                 Next.js: páginas, componentes, regras do navegador
│   ├── app/             rotas: /, /estado/[uf], /hemocentro/[id], /posso-doar, sitemap, robots
│   ├── lib/domain/      regras de doação, compatibilidade, níveis (TypeScript puro)
│   └── tests/           Vitest + Testing Library; e2e com Playwright
├── api/                 Go: API HTTP, coletor e importador
│   ├── cmd/api/         servidor HTTP
│   ├── cmd/coletor/     coleta das fontes (rodado pelo systemd timer)
│   ├── cmd/importar/    carga anual Anvisa + IBGE
│   ├── internal/fontes/ um leitor por hemocentro + fixtures
│   ├── internal/store/  consultas Postgres (pgx)
│   └── migrations/      SQL versionado (goose)
├── deploy/              docker-compose.yml, cloudflared, backup
└── docs/                pesquisa e design
```

## Contrato da API (v1)

| Método | Rota | Resposta |
|---|---|---|
| GET | `/v1/estoque` | estoque atual de cada hemocentro, com histórico de dias críticos |
| GET | `/v1/estoque/{uf}` | o mesmo, filtrado por estado |
| GET | `/v1/estatisticas` | coletas por mil habitantes por estado (Anvisa + IBGE) |
| GET | `/v1/doacoes/mes` | total de doações registradas no mês |
| POST | `/v1/doacoes` | registra doação (só UF e tipo, sem dado pessoal) |

## Estratégia de testes

| Camada | Ferramenta | O que cobre |
|---|---|---|
| Regras do navegador | Vitest | elegibilidade, compatibilidade, formatação |
| Componentes | Vitest + Testing Library | formulários, painel, estados de erro |
| Leitores das fontes | `go test` + fixtures | cada página real salva, sem internet |
| Banco e API | `go test` + Postgres no runner | consultas, validação, rotas HTTP |
| Fluxo completo | Playwright | página inicial, filtro, quiz, registro de doação |

Cobertura: Vitest (v8) e `go test -coverprofile`, enviadas ao Codecov com as flags `web` e `api`. O CI roda tudo em Linux, macOS e Windows. O Postgres é instalado no runner pela action `ikalnytskyi/action-setup-postgres`, porque macOS e Windows não têm Docker no GitHub Actions.

## O que vem da versão atual

A versão em Vue + Cloudflare D1 já validou as fontes e as regras. Na migração:

- `src/domain` (regras de doação, compatibilidade, níveis, datas) vai para `web/lib/domain` quase sem mudança, com os testes
- os 6 leitores de fonte e a coleta são reescritos em Go, com as mesmas fixtures e os mesmos casos de teste
- o schema SQL passa para Postgres
- as estatísticas da Anvisa e do IBGE viram o comando `importar`
