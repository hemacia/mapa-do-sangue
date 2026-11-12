.DEFAULT_GOAL := help
GOLANGCI := docker run --rm -v "$(CURDIR)/api":/src -w /src -v golangci-cache:/root/.cache golangci/golangci-lint:v2.15.0-alpine golangci-lint

.PHONY: help
help: ## Lista os comandos
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  make %-16s %s\n", $$1, $$2}'

.PHONY: dev
dev: ## Sobe Postgres e API com recarga automática
	docker compose up --build --watch

.PHONY: down
down: ## Para o ambiente local
	docker compose down

.PHONY: db
db: ## Sobe só o Postgres (para rodar testes fora do Docker)
	docker compose up -d --wait postgres

.PHONY: test
test: test-web test-api ## Roda todos os testes de unidade

.PHONY: test-web
test-web: ## Testes do site (Vitest)
	npm test

.PHONY: test-api
test-api: ## Testes da API; os do banco usam DATABASE_URL_TEST (make db)
	cd api && go test -race -coverprofile=coverage.out ./...

.PHONY: test-api-docker
test-api-docker: ## Testes da API em Docker com Postgres limpo
	docker compose -f compose.test.yaml run --rm testes; status=$$?; \
	docker compose -f compose.test.yaml down -v; exit $$status

.PHONY: test-e2e
test-e2e: ## Testes end-to-end do site antigo (Vue)
	npm run test:e2e

E2E := docker compose -f compose.test.yaml --profile e2e

.PHONY: test-e2e-web
test-e2e-web: ## Testes end-to-end do site Next.js contra a API em Docker com dados fixos
	$(E2E) up -d --build --wait postgres api
	$(E2E) exec -T postgres psql -q -v ON_ERROR_STOP=1 -U postgres < web/tests/e2e/seed.sql
	cd web && npx playwright test; status=$$?; cd .. && $(E2E) down -v; exit $$status

.PHONY: lint
lint: ## Lint da API
	$(GOLANGCI) run

.PHONY: fmt
fmt: ## Formata o código Go
	$(GOLANGCI) fmt

.PHONY: generate
generate: ## Gera o servidor Go a partir de api/openapi.yaml
	cd api && go generate ./...

.PHONY: check-generate
check-generate: generate ## Falha se o código gerado estiver desatualizado
	git diff --exit-code -- api/internal/httpapi/api.gen.go
