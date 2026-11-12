// Comando coletor: baixa o estoque de todas as fontes e grava no Postgres. Roda e sai
// (o agendamento fica com quem chama: systemd timer, cron ou GitHub Actions).
package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hemacia/mapa-do-sangue/api/internal/coleta"
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

	if err := store.Novo(pool, time.Now).GravarColeta(ctx, resultados, agora); err != nil {
		return err
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
				fmt.Printf("falha %-10s %v\n", r.FonteID, r.Erro)
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
		fmt.Printf("ok    %-10s %s (fonte: %s)\n", r.FonteID, strings.Join(niveis, " "), data)
	}
}

// O erro pode trazer texto da fonte: sem escapar, uma quebra de linha viraria outro comando do Actions.
var escapeComando = strings.NewReplacer("%", "%25", "\r", "%0D", "\n", "%0A")

func escaparComando(texto string) string { return escapeComando.Replace(texto) }
