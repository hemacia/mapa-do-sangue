// Comando estatisticas: gera uma migration com as coletas e os indicadores dos doadores
// da Anvisa (Hemoprod) e a população do IBGE, para os anos pedidos.
//
// Uso: go run ./cmd/estatisticas caminho/hemoprod_nacional.csv migrations/<arquivo>.sql 2023 2024 2025
// CSV: https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/hemacia/mapa-do-sangue/api/internal/estatisticas"
)

func main() {
	if err := executar(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func executar(args []string) error {
	if len(args) < 3 {
		return errors.New("uso: estatisticas hemoprod_nacional.csv migrations/00008_estatisticas.sql 2023 2024 2025")
	}
	var anos []int
	for _, a := range args[2:] {
		ano, err := strconv.Atoi(a)
		if err != nil {
			return fmt.Errorf("ano inválido: %s", a)
		}
		anos = append(anos, ano)
	}
	arquivo, err := os.Open(args[0]) //nolint:gosec // ferramenta local: o caminho vem de quem roda
	if err != nil {
		return err
	}
	defer func() { _ = arquivo.Close() }()
	totais, err := estatisticas.AgregarPorUF(arquivo, anos, estatisticas.Indicadores)
	if err != nil {
		return err
	}
	populacao := map[int]map[string]int{}
	for _, ano := range anos {
		if populacao[ano], err = populacaoIBGE(ano); err != nil {
			return fmt.Errorf("população do IBGE em %d: %w", ano, err)
		}
	}
	if err := os.WriteFile(args[1], //nolint:gosec // ferramenta local: o destino vem de quem roda
		[]byte(estatisticas.GerarMigration(totais, populacao)), 0o600); err != nil {
		return err
	}
	fmt.Println("gravado em", args[1])
	return nil
}

// Estimativa de população por UF (agregado 6579 do SIDRA).
func populacaoIBGE(ano int) (map[string]int, error) {
	ctx, cancelar := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancelar()
	url := fmt.Sprintf("https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/%d/variaveis/9324?localidades=N3[all]", ano)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil) //nolint:gosec // URL fixa do IBGE, só o ano muda
	if err != nil {
		return nil, err
	}
	resp, err := http.DefaultClient.Do(req) //nolint:gosec // URL fixa do IBGE
	if err != nil {
		return nil, err
	}
	defer func() { _ = resp.Body.Close() }()
	var corpo []struct {
		Resultados []struct {
			Series []struct {
				Localidade struct {
					Nome string `json:"nome"`
				} `json:"localidade"`
				Serie map[string]string `json:"serie"`
			} `json:"series"`
		} `json:"resultados"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&corpo); err != nil {
		return nil, err
	}
	if len(corpo) == 0 || len(corpo[0].Resultados) == 0 {
		return nil, errors.New("resposta sem resultados")
	}
	populacao := map[string]int{}
	for _, s := range corpo[0].Resultados[0].Series {
		if uf := estatisticas.SiglaDaUF(s.Localidade.Nome); uf != "" {
			populacao[uf], _ = strconv.Atoi(s.Serie[strconv.Itoa(ano)])
		}
	}
	if len(populacao) != len(estatisticas.UFs) {
		return nil, fmt.Errorf("vieram %d UFs, quero %d", len(populacao), len(estatisticas.UFs))
	}
	return populacao, nil
}
