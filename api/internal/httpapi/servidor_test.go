package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type repositorioFalso struct {
	erroPing     error
	erro         error
	estoque      []EstoqueHemocentro
	ufPedida     string
	doacoes      []Doacao
	mesPedido    string
	totalDoMes   int
	estatisticas []EstatisticaUF
}

func (r *repositorioFalso) Ping(context.Context) error { return r.erroPing }

func (r *repositorioFalso) EstoqueAtual(_ context.Context, uf string) ([]EstoqueHemocentro, error) {
	r.ufPedida = uf
	return r.estoque, r.erro
}

func (r *repositorioFalso) Estatisticas(context.Context) ([]EstatisticaUF, error) {
	return r.estatisticas, r.erro
}

func (r *repositorioFalso) RegistrarDoacao(_ context.Context, d Doacao) error {
	r.doacoes = append(r.doacoes, d)
	return r.erro
}

func (r *repositorioFalso) ContarDoacoes(_ context.Context, mes string) (int, error) {
	r.mesPedido = mes
	return r.totalDoMes, r.erro
}

// 01:30 UTC de 1º de dezembro ainda é 30 de novembro em Brasília.
var agoraFixo = time.Date(2026, 12, 1, 1, 30, 0, 0, time.UTC)

func novoServidor(repo Repositorio) http.Handler {
	return NovoHandler(repo, Opcoes{
		OrigemPermitida:  "https://mapadosangue.com.br",
		Agora:            func() time.Time { return agoraFixo },
		Log:              slog.New(slog.NewTextHandler(io.Discard, nil)),
		DoacoesPorMinuto: 2,
	})
}

func requisitar(h http.Handler, metodo, rota, corpo string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(metodo, rota, strings.NewReader(corpo))
	if corpo != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	resp := httptest.NewRecorder()
	h.ServeHTTP(resp, req)
	return resp
}

func decodificar[T any](t *testing.T, resp *httptest.ResponseRecorder) T {
	t.Helper()
	var v T
	if err := json.Unmarshal(resp.Body.Bytes(), &v); err != nil {
		t.Fatalf("resposta não é JSON: %v (%s)", err, resp.Body.String())
	}
	return v
}

func TestHealthzRespondeOkMesmoSemBanco(t *testing.T) {
	h := novoServidor(&repositorioFalso{erroPing: errors.New("fora do ar")})

	resp := requisitar(h, http.MethodGet, "/healthz", "")

	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, quero 200", resp.Code)
	}
}

func TestReadyzRespondeOkQuandoOBancoResponde(t *testing.T) {
	h := novoServidor(&repositorioFalso{})

	resp := requisitar(h, http.MethodGet, "/readyz", "")

	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, quero 200", resp.Code)
	}
}

func TestReadyzResponde503QuandoOBancoNaoResponde(t *testing.T) {
	h := novoServidor(&repositorioFalso{erroPing: errors.New("conexão recusada")})

	resp := requisitar(h, http.MethodGet, "/readyz", "")

	if resp.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, quero 503", resp.Code)
	}
	if ct := resp.Header().Get("Content-Type"); ct != "application/problem+json" {
		t.Errorf("Content-Type = %q, quero application/problem+json", ct)
	}
}

func TestListarEstoqueDevolveOQueORepositorioTem(t *testing.T) {
	repo := &repositorioFalso{estoque: []EstoqueHemocentro{{Id: "hemominas-bh", Uf: "MG", NivelGeral: Critico}}}
	h := novoServidor(repo)

	resp := requisitar(h, http.MethodGet, "/v1/estoque", "")

	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, quero 200", resp.Code)
	}
	corpo := decodificar[[]EstoqueHemocentro](t, resp)
	if len(corpo) != 1 || corpo[0].Id != "hemominas-bh" {
		t.Errorf("corpo = %+v", corpo)
	}
	if repo.ufPedida != "" {
		t.Errorf("uf pedida = %q, quero vazia (todas)", repo.ufPedida)
	}
}

func TestListarEstoqueFiltraPorUFEmMinusculas(t *testing.T) {
	repo := &repositorioFalso{}
	h := novoServidor(repo)

	resp := requisitar(h, http.MethodGet, "/v1/estoque?uf=mg", "")

	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, quero 200", resp.Code)
	}
	if repo.ufPedida != "MG" {
		t.Errorf("uf pedida = %q, quero MG", repo.ufPedida)
	}
}

func TestListarEstoqueRecusaUFInexistente(t *testing.T) {
	h := novoServidor(&repositorioFalso{})

	resp := requisitar(h, http.MethodGet, "/v1/estoque?uf=XX", "")

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, quero 400", resp.Code)
	}
	problema := decodificar[Problema](t, resp)
	if problema.Status != 400 || problema.Title == "" {
		t.Errorf("problema = %+v", problema)
	}
}

func TestListarEstoqueNuncaDevolveNull(t *testing.T) {
	h := novoServidor(&repositorioFalso{estoque: nil})

	resp := requisitar(h, http.MethodGet, "/v1/estoque", "")

	if strings.TrimSpace(resp.Body.String()) != "[]" {
		t.Errorf("corpo = %q, quero []", resp.Body.String())
	}
}

func TestErroDoBancoViraProblema500SemVazarDetalhes(t *testing.T) {
	h := novoServidor(&repositorioFalso{erro: errors.New("senha do banco: segredo")})

	resp := requisitar(h, http.MethodGet, "/v1/estatisticas", "")

	if resp.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, quero 500", resp.Code)
	}
	if strings.Contains(resp.Body.String(), "segredo") {
		t.Errorf("a resposta vazou o erro interno: %s", resp.Body.String())
	}
}

func TestRegistrarDoacaoUsaADataDeBrasilia(t *testing.T) {
	repo := &repositorioFalso{}
	h := novoServidor(repo)

	resp := requisitar(h, http.MethodPost, "/v1/doacoes", `{"uf":"mg","tipo":"O-"}`)

	if resp.Code != http.StatusCreated {
		t.Fatalf("status = %d, quero 201 (%s)", resp.Code, resp.Body.String())
	}
	doacao := decodificar[Doacao](t, resp)
	if doacao.Uf != "MG" || doacao.Tipo == nil || *doacao.Tipo != O1 || doacao.Data.String() != "2026-11-30" {
		t.Errorf("doação = %+v", doacao)
	}
	if len(repo.doacoes) != 1 {
		t.Errorf("gravou %d doações, quero 1", len(repo.doacoes))
	}
}

func TestRegistrarDoacaoAceitaTipoNaoInformado(t *testing.T) {
	repo := &repositorioFalso{}
	h := novoServidor(repo)

	resp := requisitar(h, http.MethodPost, "/v1/doacoes", `{"uf":"SP"}`)

	if resp.Code != http.StatusCreated {
		t.Fatalf("status = %d, quero 201", resp.Code)
	}
	if repo.doacoes[0].Tipo != nil {
		t.Errorf("tipo = %v, quero nil", *repo.doacoes[0].Tipo)
	}
}

func TestRegistrarDoacaoRecusaDadosInvalidos(t *testing.T) {
	casos := map[string]string{
		"uf inexistente": `{"uf":"ZZ"}`,
		"sem uf":         `{}`,
		"tipo inválido":  `{"uf":"MG","tipo":"C+"}`,
		"json quebrado":  `{"uf":`,
	}
	for nome, corpo := range casos {
		t.Run(nome, func(t *testing.T) {
			repo := &repositorioFalso{}
			h := novoServidor(repo)

			resp := requisitar(h, http.MethodPost, "/v1/doacoes", corpo)

			if resp.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, quero 400", resp.Code)
			}
			if ct := resp.Header().Get("Content-Type"); ct != "application/problem+json" {
				t.Errorf("Content-Type = %q", ct)
			}
			if len(repo.doacoes) != 0 {
				t.Error("não deveria gravar doação inválida")
			}
		})
	}
}

func TestRegistrarDoacaoLimitaRequisicoesPorIP(t *testing.T) {
	h := novoServidor(&repositorioFalso{})

	requisitar(h, http.MethodPost, "/v1/doacoes", `{"uf":"MG"}`)
	requisitar(h, http.MethodPost, "/v1/doacoes", `{"uf":"MG"}`)
	resp := requisitar(h, http.MethodPost, "/v1/doacoes", `{"uf":"MG"}`)

	if resp.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, quero 429", resp.Code)
	}
}

func TestContarDoacoesUsaOMesDeBrasilia(t *testing.T) {
	repo := &repositorioFalso{totalDoMes: 42}
	h := novoServidor(repo)

	resp := requisitar(h, http.MethodGet, "/v1/doacoes/mes", "")

	total := decodificar[TotalDoMes](t, resp)
	if total.Mes != "2026-11" || total.Total != 42 || repo.mesPedido != "2026-11" {
		t.Errorf("total = %+v, mês pedido = %q", total, repo.mesPedido)
	}
}

func TestRespostasTemCabecalhosDeSeguranca(t *testing.T) {
	h := novoServidor(&repositorioFalso{})

	resp := requisitar(h, http.MethodGet, "/healthz", "")

	quero := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"Referrer-Policy":        "no-referrer",
	}
	for cabecalho, valor := range quero {
		if got := resp.Header().Get(cabecalho); got != valor {
			t.Errorf("%s = %q, quero %q", cabecalho, got, valor)
		}
	}
}

func TestCORSLiberaSoAOrigemDoSite(t *testing.T) {
	h := novoServidor(&repositorioFalso{})
	casos := map[string]string{
		"https://mapadosangue.com.br": "https://mapadosangue.com.br",
		"https://site-malicioso.com":  "",
	}
	for origem, quero := range casos {
		req := httptest.NewRequest(http.MethodOptions, "/v1/doacoes", nil)
		req.Header.Set("Origin", origem)
		req.Header.Set("Access-Control-Request-Method", "POST")
		resp := httptest.NewRecorder()

		h.ServeHTTP(resp, req)

		if got := resp.Header().Get("Access-Control-Allow-Origin"); got != quero {
			t.Errorf("origem %s: Allow-Origin = %q, quero %q", origem, got, quero)
		}
	}
}

func TestRotaInexistenteResponde404(t *testing.T) {
	h := novoServidor(&repositorioFalso{})

	resp := requisitar(h, http.MethodGet, "/v1/nada", "")

	if resp.Code != http.StatusNotFound {
		t.Fatalf("status = %d, quero 404", resp.Code)
	}
}

func TestRegistrarDoacaoRecusaCorpoGrandeDemais(t *testing.T) {
	repo := &repositorioFalso{}
	h := novoServidor(repo)
	corpo := `{"uf":"MG","lixo":"` + strings.Repeat("x", 20<<10) + `"}`

	resp := requisitar(h, http.MethodPost, "/v1/doacoes", corpo)

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, quero 400", resp.Code)
	}
	if len(repo.doacoes) != 0 {
		t.Error("não deveria gravar")
	}
}
