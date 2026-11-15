// Comando cnes: gera a migration com as unidades de hemoterapia do CNES que podem receber doador.
//
// Uso: go run ./cmd/cnes migrations/<arquivo>.sql
// Fontes: API de dados abertos do Ministério da Saúde (CNES) e API de localidades do IBGE.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/hemacia/mapa-do-sangue/api/internal/cnes"
)

const porPagina = 20 // máximo que a API aceita; o parâmetro offset é o número da página, não o deslocamento

func main() {
	if err := executar(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func executar(args []string) error {
	if len(args) != 1 {
		return errors.New("uso: cnes migrations/00010_pontos_coleta.sql")
	}
	ctx, cancelar := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancelar()

	var estabelecimentos []cnes.Estabelecimento
	for pagina := 0; ; pagina++ {
		var resposta struct {
			Estabelecimentos []cnes.Estabelecimento `json:"estabelecimentos"`
		}
		url := fmt.Sprintf("https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_tipo_unidade=69&limit=%d&offset=%d", porPagina, pagina)
		if err := baixarJSON(ctx, url, &resposta); err != nil {
			return fmt.Errorf("CNES, página %d: %w", pagina, err)
		}
		estabelecimentos = append(estabelecimentos, resposta.Estabelecimentos...)
		if len(resposta.Estabelecimentos) < porPagina {
			break
		}
	}

	var listaMunicipios []struct {
		ID   int    `json:"id"`
		Nome string `json:"nome"`
	}
	if err := baixarJSON(ctx, "https://servicodados.ibge.gov.br/api/v1/localidades/municipios", &listaMunicipios); err != nil {
		return fmt.Errorf("municípios do IBGE: %w", err)
	}
	municipios := map[int]string{}
	for _, m := range listaMunicipios {
		municipios[m.ID/10] = m.Nome // o CNES usa o código sem o dígito verificador
	}
	var listaUFs []struct {
		ID    int    `json:"id"`
		Sigla string `json:"sigla"`
	}
	if err := baixarJSON(ctx, "https://servicodados.ibge.gov.br/api/v1/localidades/estados", &listaUFs); err != nil {
		return fmt.Errorf("estados do IBGE: %w", err)
	}
	ufs := map[int]string{}
	for _, u := range listaUFs {
		ufs[u.ID] = u.Sigla
	}

	pontos := cnes.Selecionar(estabelecimentos, municipios, ufs)
	sql := cnes.GerarMigration(pontos, time.Now().Format(time.DateOnly))
	if err := os.WriteFile(args[0], []byte(sql), 0o600); err != nil { //nolint:gosec // ferramenta local: o destino vem de quem roda
		return err
	}
	fmt.Printf("%d de %d unidades gravadas em %s\n", len(pontos), len(estabelecimentos), args[0])
	return nil
}

// A API do CNES falha às vezes no meio da paginação: tenta de novo antes de desistir.
func baixarJSON(ctx context.Context, url string, destino any) error {
	var err error
	for tentativa := range 4 {
		if tentativa > 0 {
			time.Sleep(time.Duration(tentativa) * 3 * time.Second)
		}
		var req *http.Request
		if req, err = http.NewRequestWithContext(ctx, http.MethodGet, url, nil); err != nil {
			return err
		}
		var resp *http.Response
		if resp, err = http.DefaultClient.Do(req); err != nil { //nolint:gosec // URLs fixas do governo
			continue
		}
		if resp.StatusCode != http.StatusOK {
			_ = resp.Body.Close()
			err = fmt.Errorf("HTTP %d", resp.StatusCode)
			continue
		}
		err = json.NewDecoder(resp.Body).Decode(destino)
		_ = resp.Body.Close()
		if err == nil {
			return nil
		}
	}
	return err
}
