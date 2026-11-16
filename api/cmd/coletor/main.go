// Comando coletor: baixa o estoque de todas as fontes e grava no Postgres. Roda e sai
// (o agendamento fica com quem chama: systemd timer, cron ou GitHub Actions).
//
// Com -anvisa, em vez do estoque, atualiza as estatísticas pelo CSV nacional da Anvisa (uma vez por mês).
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"maps"
	"net/http"
	"os"
	"os/signal"
	"slices"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hemacia/mapa-do-sangue/api/internal/coleta"
	"github.com/hemacia/mapa-do-sangue/api/internal/estatisticas"
	"github.com/hemacia/mapa-do-sangue/api/internal/store"
)

func main() {
	if err := executar(); err != nil {
		fmt.Fprintln(os.Stderr, "coleta falhou:", err)
		os.Exit(1)
	}
}

func executar() error {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		return errors.New("DATABASE_URL não definida")
	}
	ctx, parar := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer parar()

	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return err
	}
	defer pool.Close()
	if len(os.Args) > 1 && os.Args[1] == "-anvisa" {
		if err := store.Migrar(ctx, pool); err != nil {
			return err
		}
		return atualizarAnvisa(ctx, store.Novo(pool, time.Now))
	}
	if err := store.Migrar(ctx, pool); err != nil {
		return err
	}
	cliente, err := coleta.ClienteHTTP()
	if err != nil {
		return err
	}

	agora := time.Now().UTC().Truncate(time.Second)
	resultados := coleta.ColetarTodas(ctx, coleta.Fontes, coleta.BaixarHTTP(cliente), agora)
	relatar(resultados, os.Getenv("GITHUB_ACTIONS") == "true")

	banco := store.Novo(pool, time.Now)
	if err := banco.GravarColeta(ctx, resultados, agora); err != nil {
		return err
	}
	// Notícia é complemento: se falhar, a coleta do estoque continua valendo.
	noticias, errosNoticias := coleta.ColetarNoticias(ctx, coleta.FontesNoticias, coleta.BaixarHTTP(cliente), agora)
	for id, err := range errosNoticias {
		fmt.Printf("falha %-17s notícias: %v\n", id, err)
	}
	if err := banco.GravarAlertas(ctx, noticias, agora); err != nil {
		fmt.Printf("falha ao gravar alertas: %v\n", err)
	}
	fmt.Printf("alertas noticiados nos últimos 60 dias: %d\n", len(noticias))
	// O portal do ES regrava o arquivo e apaga dias antigos: guardar os dias que ele ainda mostra.
	if corpo, err := coleta.BaixarHTTP(cliente)(ctx, coleta.URLHistoricoHemoes); err != nil {
		fmt.Printf("falha histórico HEMOES: %v\n", err)
	} else if dias, err := coleta.LerHistoricoHemoes(string(corpo), agora); err != nil {
		fmt.Printf("falha histórico HEMOES: %v\n", err)
	} else if novos, err := banco.GravarHistorico(ctx, dias); err != nil {
		fmt.Printf("falha ao gravar o histórico HEMOES: %v\n", err)
	} else {
		fmt.Printf("histórico HEMOES: %d dias no portal, %d novos\n", len(dias), novos)
	}
	for _, r := range resultados {
		if r.Erro == nil {
			return nil
		}
	}
	return errors.New("nenhuma fonte respondeu")
}

func relatar(resultados []coleta.Resultado, noActions bool) {
	for _, r := range resultados {
		if r.Erro != nil {
			if noActions {
				// Anotação que aparece no resumo do GitHub Actions.
				fmt.Printf("::warning title=Coleta %s::%s\n", r.FonteID, escaparComando(r.Erro.Error()))
			} else {
				fmt.Printf("falha %-17s %v\n", r.FonteID, r.Erro)
			}
			continue
		}
		niveis := make([]string, len(r.Leituras))
		for i, l := range r.Leituras {
			niveis[i] = fmt.Sprintf("%s=%s", l.Tipo, l.Nivel)
		}
		data := r.AtualizadoNaFonte
		if data == "" {
			data = "sem data"
		}
		fmt.Printf("ok    %-17s %s (fonte: %s)\n", r.FonteID, strings.Join(niveis, " "), data)
	}
}

// O erro pode trazer texto da fonte: sem escapar, uma quebra de linha viraria outro comando do Actions.
var escapeComando = strings.NewReplacer("%", "%25", "\r", "%0D", "\n", "%0A")

func escaparComando(texto string) string { return escapeComando.Replace(texto) }

// O CSV tem uns 20 MB, acima do limite das páginas de estoque.
const tamanhoMaximoCSV = 128 << 20

func atualizarAnvisa(ctx context.Context, banco *store.Store) error {
	cliente := &http.Client{Timeout: 5 * time.Minute}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, estatisticas.URLHemoprod, nil)
	if err != nil {
		return err
	}
	resp, err := cliente.Do(req) //nolint:gosec // URL fixa da Anvisa
	if err != nil {
		return fmt.Errorf("Anvisa: %w", err) //nolint:staticcheck // nome do órgão
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Anvisa: HTTP %d", resp.StatusCode) //nolint:staticcheck // nome do órgão
	}
	csv, err := io.ReadAll(io.LimitReader(resp.Body, tamanhoMaximoCSV))
	if err != nil {
		return err
	}
	ano := time.Now().In(brasilia).Year()
	imp, err := estatisticas.ImportarCSV(ctx, csv, ano, estatisticas.BuscarNoIBGE(cliente, "https://servicodados.ibge.gov.br"))
	if err != nil {
		return err
	}
	if err := banco.GravarImportacao(ctx, imp); err != nil {
		return err
	}
	fmt.Printf("Anvisa: anos %v atualizados", slices.Sorted(maps.Keys(imp.Totais)))
	if imp.AteMes > 0 {
		comparaveis := 0
		for _, c := range imp.Comparativo {
			if c[0] > 0 && c[1] > 0 {
				comparaveis++
			}
		}
		fmt.Printf("; %d até o mês %d, %d estados no comparativo", ano, imp.AteMes, comparaveis)
	}
	fmt.Println()
	return nil
}

var brasilia = func() *time.Location {
	local, err := time.LoadLocation("America/Sao_Paulo")
	if err != nil {
		return time.FixedZone("BRT", -3*60*60)
	}
	return local
}()
