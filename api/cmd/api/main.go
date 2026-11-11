// Comando api: aplica as migrations e serve a API HTTP até receber SIGINT/SIGTERM.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hemacia/mapa-do-sangue/api/internal/config"
	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
	"github.com/hemacia/mapa-do-sangue/api/internal/store"
)

func main() {
	// A imagem distroless não tem curl: o HEALTHCHECK do Docker chama o próprio binário.
	if len(os.Args) > 1 && os.Args[1] == "saude" {
		os.Exit(verificarSaude())
	}
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := executar(log); err != nil {
		log.Error("api encerrada com erro", "erro", err)
		os.Exit(1)
	}
}

func executar(log *slog.Logger) error {
	cfg, err := config.Carregar(os.Getenv)
	if err != nil {
		return err
	}
	ctx, parar := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer parar()

	pool, err := pgxpool.New(ctx, cfg.URLDoBanco)
	if err != nil {
		return err
	}
	defer pool.Close()
	if err := store.Migrar(ctx, pool); err != nil {
		return err
	}

	servidor := &http.Server{
		Addr: ":" + cfg.Porta,
		Handler: httpapi.NovoHandler(store.Novo(pool, time.Now), httpapi.Opcoes{
			OrigemPermitida:  cfg.OrigemPermitida,
			Agora:            time.Now,
			Log:              log,
			DoacoesPorMinuto: 5,
		}),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 16,
	}

	erros := make(chan error, 1)
	go func() {
		log.Info("api no ar", "porta", cfg.Porta)
		erros <- servidor.ListenAndServe()
	}()

	select {
	case err := <-erros:
		return err
	case <-ctx.Done():
	}
	// Termina as requisições em andamento antes de sair.
	log.Info("desligando")
	desligar, cancelar := context.WithTimeout(context.Background(), cfg.TempoDeDesligamento)
	defer cancelar()
	if err := servidor.Shutdown(desligar); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

func verificarSaude() int {
	porta := os.Getenv("PORT")
	if porta == "" {
		porta = "8080"
	}
	cliente := http.Client{Timeout: 2 * time.Second}
	resp, err := cliente.Get("http://127.0.0.1:" + porta + "/healthz")
	if err != nil || resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}
