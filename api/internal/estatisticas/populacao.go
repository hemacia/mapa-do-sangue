package estatisticas

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
)

// Tabela do SIDRA com a população de cada UF num ano.
type FontePopulacao struct {
	Agregado, Variavel string
}

var (
	estimativaIBGE = FontePopulacao{"6579", "9324"}
	censo2010      = FontePopulacao{"1378", "93"}
	censo2022      = FontePopulacao{"4709", "93"}
)

// Em ano de Censo não há estimativa: 2010 e 2022 vêm do Censo. 2023 não tem nenhuma das duas
// (o IBGE pulou a estimativa depois do Censo de 2022) e fica na média entre 2022 e 2024.
func fonteDoAno(ano int) FontePopulacao {
	switch ano {
	case 2010:
		return censo2010
	case 2022:
		return censo2022
	default:
		return estimativaIBGE
	}
}

type BuscarPopulacao func(ctx context.Context, fonte FontePopulacao, ano int) (map[string]int, error)

func PopulacaoPorAno(ctx context.Context, buscar BuscarPopulacao, anos []int) (map[int]map[string]int, error) {
	cache := map[int]map[string]int{}
	var pegar func(ano int) (map[string]int, error)
	pegar = func(ano int) (map[string]int, error) {
		if p, ok := cache[ano]; ok {
			return p, nil
		}
		var p map[string]int
		if ano == 2023 {
			antes, err := pegar(2022)
			if err != nil {
				return nil, err
			}
			depois, err := pegar(2024)
			if err != nil {
				return nil, err
			}
			p = map[string]int{}
			for uf := range antes {
				p[uf] = (antes[uf] + depois[uf]) / 2
			}
		} else {
			var err error
			if p, err = buscar(ctx, fonteDoAno(ano), ano); err != nil {
				return nil, fmt.Errorf("população de %d: %w", ano, err)
			}
		}
		if len(p) != len(UFs) {
			return nil, fmt.Errorf("população de %d: vieram %d UFs, quero %d", ano, len(p), len(UFs))
		}
		cache[ano] = p
		return p, nil
	}
	populacao := map[int]map[string]int{}
	for _, ano := range anos {
		p, err := pegar(ano)
		if err != nil {
			return nil, err
		}
		populacao[ano] = p
	}
	return populacao, nil
}

// BuscarNoIBGE consulta a API de agregados do IBGE (SIDRA) para as 27 UFs.
func BuscarNoIBGE(cliente *http.Client, base string) BuscarPopulacao {
	return func(ctx context.Context, fonte FontePopulacao, ano int) (map[string]int, error) {
		url := fmt.Sprintf("%s/api/v3/agregados/%s/periodos/%d/variaveis/%s?localidades=N3%%5Ball%%5D", base, fonte.Agregado, ano, fonte.Variavel)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return nil, err
		}
		resp, err := cliente.Do(req) //nolint:gosec // URL do IBGE montada com valores fixos
		if err != nil {
			return nil, err
		}
		defer func() { _ = resp.Body.Close() }()
		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("IBGE: HTTP %d", resp.StatusCode)
		}
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
			return nil, errors.New("IBGE: resposta sem resultados")
		}
		populacao := map[string]int{}
		for _, s := range corpo[0].Resultados[0].Series {
			if uf := SiglaDaUF(s.Localidade.Nome); uf != "" {
				populacao[uf], _ = strconv.Atoi(s.Serie[strconv.Itoa(ano)])
			}
		}
		return populacao, nil
	}
}
