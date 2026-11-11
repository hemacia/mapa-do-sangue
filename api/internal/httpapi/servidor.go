package httpapi

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"slices"
	"strings"
	"time"
	_ "time/tzdata" // fuso de Brasília também no Windows e na imagem distroless

	openapi_types "github.com/oapi-codegen/runtime/types"
)

// Repositorio é o que a API precisa do banco. A implementação real fica em internal/store.
type Repositorio interface {
	Ping(ctx context.Context) error
	EstoqueAtual(ctx context.Context, uf string) ([]EstoqueHemocentro, error) // uf vazia = todas
	Estatisticas(ctx context.Context) ([]EstatisticaUF, error)
	RegistrarDoacao(ctx context.Context, doacao Doacao) error
	ContarDoacoes(ctx context.Context, mes string) (int, error) // mes = AAAA-MM
}

type Opcoes struct {
	OrigemPermitida  string
	Agora            func() time.Time
	Log              *slog.Logger
	DoacoesPorMinuto int
}

var UFs = []string{
	"AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
	"PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
}

var brasilia = carregarFuso("America/Sao_Paulo")

func carregarFuso(nome string) *time.Location {
	fuso, err := time.LoadLocation(nome)
	if err != nil {
		panic(err) // tzdata está embutido; só falha se o nome estiver errado
	}
	return fuso
}

type servidor struct {
	repo  Repositorio
	agora func() time.Time
}

func NovoHandler(repo Repositorio, opcoes Opcoes) http.Handler {
	s := &servidor{repo: repo, agora: opcoes.Agora}
	strict := NewStrictHandlerWithOptions(s, nil, StrictHTTPServerOptions{
		RequestErrorHandlerFunc: func(w http.ResponseWriter, _ *http.Request, err error) {
			escreverProblema(w, http.StatusBadRequest, "Requisição inválida", err.Error())
		},
		ResponseErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			opcoes.Log.ErrorContext(r.Context(), "erro ao responder", "rota", r.URL.Path, "erro", err)
			escreverProblema(w, http.StatusInternalServerError, "Erro interno", "")
		},
	})
	rotas := HandlerWithOptions(strict, StdHTTPServerOptions{
		ErrorHandlerFunc: func(w http.ResponseWriter, _ *http.Request, err error) {
			escreverProblema(w, http.StatusBadRequest, "Parâmetro inválido", err.Error())
		},
	})
	limite := novoLimitador(opcoes.DoacoesPorMinuto, time.Minute, opcoes.Agora)
	return registrarAcesso(opcoes.Log, seguranca(cors(opcoes.OrigemPermitida, limitarDoacoes(limite, rotas))))
}

func escreverProblema(w http.ResponseWriter, status int, titulo, detalhe string) {
	problema := Problema{Status: status, Title: titulo}
	if detalhe != "" {
		problema.Detail = &detalhe
	}
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(problema)
}

func problema(status int, titulo, detalhe string) ProblemaApplicationProblemPlusJSONResponse {
	p := ProblemaApplicationProblemPlusJSONResponse{Status: status, Title: titulo}
	if detalhe != "" {
		p.Detail = &detalhe
	}
	return p
}

func (s *servidor) VerificarSaude(context.Context, VerificarSaudeRequestObject) (VerificarSaudeResponseObject, error) {
	return VerificarSaude200JSONResponse{Status: "ok"}, nil
}

func (s *servidor) VerificarProntidao(ctx context.Context, _ VerificarProntidaoRequestObject) (VerificarProntidaoResponseObject, error) {
	if err := s.repo.Ping(ctx); err != nil {
		return VerificarProntidao503ApplicationProblemPlusJSONResponse{problema(503, "Banco indisponível", "")}, nil
	}
	return VerificarProntidao200JSONResponse{Status: "ok"}, nil
}

func (s *servidor) ListarEstoque(ctx context.Context, req ListarEstoqueRequestObject) (ListarEstoqueResponseObject, error) {
	uf := ""
	if req.Params.Uf != nil {
		uf = strings.ToUpper(*req.Params.Uf)
		if !slices.Contains(UFs, uf) {
			return ListarEstoque400ApplicationProblemPlusJSONResponse{problema(400, "UF inválida", uf)}, nil
		}
	}
	estoque, err := s.repo.EstoqueAtual(ctx, uf)
	if err != nil {
		return nil, err
	}
	return ListarEstoque200JSONResponse(naoNulo(estoque)), nil
}

func (s *servidor) ListarEstatisticas(ctx context.Context, _ ListarEstatisticasRequestObject) (ListarEstatisticasResponseObject, error) {
	estatisticas, err := s.repo.Estatisticas(ctx)
	if err != nil {
		return nil, err
	}
	return ListarEstatisticas200JSONResponse(naoNulo(estatisticas)), nil
}

// O corpo vem do navegador: nada é confiável, e a data é sempre a do servidor.
func (s *servidor) RegistrarDoacao(ctx context.Context, req RegistrarDoacaoRequestObject) (RegistrarDoacaoResponseObject, error) {
	if req.Body == nil {
		return RegistrarDoacao400ApplicationProblemPlusJSONResponse{problema(400, "Corpo vazio", "")}, nil
	}
	uf := strings.ToUpper(req.Body.Uf)
	if !slices.Contains(UFs, uf) {
		return RegistrarDoacao400ApplicationProblemPlusJSONResponse{problema(400, "UF inválida", uf)}, nil
	}
	if req.Body.Tipo != nil && !req.Body.Tipo.Valid() {
		return RegistrarDoacao400ApplicationProblemPlusJSONResponse{problema(400, "Tipo sanguíneo inválido", string(*req.Body.Tipo))}, nil
	}
	doacao := Doacao{Uf: uf, Tipo: req.Body.Tipo, Data: openapi_types.Date{Time: s.hoje()}}
	if err := s.repo.RegistrarDoacao(ctx, doacao); err != nil {
		return nil, err
	}
	return RegistrarDoacao201JSONResponse(doacao), nil
}

func (s *servidor) ContarDoacoesDoMes(ctx context.Context, _ ContarDoacoesDoMesRequestObject) (ContarDoacoesDoMesResponseObject, error) {
	mes := s.hoje().Format("2006-01")
	total, err := s.repo.ContarDoacoes(ctx, mes)
	if err != nil {
		return nil, err
	}
	return ContarDoacoesDoMes200JSONResponse{Mes: mes, Total: total}, nil
}

// O servidor roda em UTC: às 22h de Brasília já seria amanhã.
func (s *servidor) hoje() time.Time {
	ano, mes, dia := s.agora().In(brasilia).Date()
	return time.Date(ano, mes, dia, 0, 0, 0, 0, time.UTC)
}

func naoNulo[T any](lista []T) []T {
	if lista == nil {
		return []T{}
	}
	return lista
}
