package config

import (
	"testing"
	"time"
)

func ambiente(vars map[string]string) func(string) string {
	return func(chave string) string { return vars[chave] }
}

func TestCarregarUsaPadroesQuandoSoODatabaseURLEstaDefinido(t *testing.T) {
	getenv := ambiente(map[string]string{"DATABASE_URL": "postgres://localhost/mapa"})

	cfg, err := Carregar(getenv)

	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	if cfg.Porta != "8080" {
		t.Errorf("Porta = %q, quero 8080", cfg.Porta)
	}
	if cfg.OrigemPermitida != "http://localhost:3000" {
		t.Errorf("OrigemPermitida = %q, quero http://localhost:3000", cfg.OrigemPermitida)
	}
	if cfg.TempoDeDesligamento != 10*time.Second {
		t.Errorf("TempoDeDesligamento = %v, quero 10s", cfg.TempoDeDesligamento)
	}
}

func TestCarregarLeOsValoresDoAmbiente(t *testing.T) {
	getenv := ambiente(map[string]string{
		"DATABASE_URL":     "postgres://db/mapa",
		"PORT":             "9000",
		"ALLOWED_ORIGIN":   "https://mapadosangue.com.br",
		"SHUTDOWN_TIMEOUT": "3s",
	})

	cfg, err := Carregar(getenv)

	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}
	quero := Config{
		URLDoBanco:          "postgres://db/mapa",
		Porta:               "9000",
		OrigemPermitida:     "https://mapadosangue.com.br",
		TempoDeDesligamento: 3 * time.Second,
	}
	if cfg != quero {
		t.Errorf("cfg = %+v, quero %+v", cfg, quero)
	}
}

func TestCarregarFalhaSemDatabaseURL(t *testing.T) {
	getenv := ambiente(map[string]string{})

	_, err := Carregar(getenv)

	if err == nil {
		t.Fatal("esperava erro sem DATABASE_URL")
	}
}

func TestCarregarFalhaComTempoDeDesligamentoInvalido(t *testing.T) {
	getenv := ambiente(map[string]string{"DATABASE_URL": "postgres://x", "SHUTDOWN_TIMEOUT": "dez"})

	_, err := Carregar(getenv)

	if err == nil {
		t.Fatal("esperava erro com SHUTDOWN_TIMEOUT inválido")
	}
}
