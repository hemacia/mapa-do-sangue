// Package config lê e valida a configuração da API a partir do ambiente.
package config

import (
	"errors"
	"fmt"
	"time"
)

type Config struct {
	URLDoBanco          string
	Porta               string
	OrigemPermitida     string
	TempoDeDesligamento time.Duration
}

// Carregar recebe os.Getenv (ou um substituto nos testes) e falha cedo se faltar algo.
func Carregar(getenv func(string) string) (Config, error) {
	cfg := Config{
		URLDoBanco:      getenv("DATABASE_URL"),
		Porta:           padrao(getenv("PORT"), "8080"),
		OrigemPermitida: padrao(getenv("ALLOWED_ORIGIN"), "http://localhost:3000"),
	}
	if cfg.URLDoBanco == "" {
		return Config{}, errors.New("DATABASE_URL não definida")
	}
	tempo, err := time.ParseDuration(padrao(getenv("SHUTDOWN_TIMEOUT"), "10s"))
	if err != nil {
		return Config{}, fmt.Errorf("SHUTDOWN_TIMEOUT inválido: %w", err)
	}
	cfg.TempoDeDesligamento = tempo
	return cfg, nil
}

func padrao(valor, alternativa string) string {
	if valor == "" {
		return alternativa
	}
	return valor
}
