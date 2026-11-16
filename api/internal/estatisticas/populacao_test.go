package estatisticas

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func populacaoFixa(valor int) map[string]int {
	p := map[string]int{}
	for _, uf := range UFs {
		p[uf] = valor
	}
	return p
}

func TestPopulacaoUsaCensoNos2010E2022EInterpola2023(t *testing.T) {
	pedidas := map[int]FontePopulacao{}
	buscar := func(_ context.Context, fonte FontePopulacao, ano int) (map[string]int, error) {
		pedidas[ano] = fonte
		return populacaoFixa(map[int]int{2010: 100, 2022: 200, 2024: 300}[ano]), nil
	}

	pop, err := PopulacaoPorAno(context.Background(), buscar, []int{2010, 2023})

	if err != nil {
		t.Fatal(err)
	}
	if pop[2010]["SP"] != 100 || pop[2023]["SP"] != 250 {
		t.Errorf("2010 = %d, 2023 = %d", pop[2010]["SP"], pop[2023]["SP"])
	}
	if pedidas[2010] != censo2010 || pedidas[2022] != censo2022 || pedidas[2024] != estimativaIBGE {
		t.Errorf("fontes = %v", pedidas)
	}
	if _, pediu := pedidas[2023]; pediu {
		t.Error("2023 não existe no IBGE e não deveria ser pedido")
	}
}

func TestPopulacaoFalhaSeFaltarUF(t *testing.T) {
	buscar := func(context.Context, FontePopulacao, int) (map[string]int, error) {
		return map[string]int{"SP": 1}, nil
	}

	if _, err := PopulacaoPorAno(context.Background(), buscar, []int{2015}); err == nil {
		t.Error("aceitou população incompleta")
	}
	erro := func(context.Context, FontePopulacao, int) (map[string]int, error) {
		return nil, errors.New("fora do ar")
	}
	if _, err := PopulacaoPorAno(context.Background(), erro, []int{2023}); err == nil || !strings.Contains(err.Error(), "2022") {
		t.Errorf("erro = %v", err)
	}
}

func TestBuscarNoIBGELeASerieDoAno(t *testing.T) {
	var caminho string
	servidor := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		caminho = r.URL.Path
		_, _ = w.Write([]byte(`[{"resultados":[{"series":[{"localidade":{"nome":"São Paulo"},"serie":{"2022":"44411238"}}]}]}]`))
	}))
	defer servidor.Close()

	pop, err := BuscarNoIBGE(servidor.Client(), servidor.URL)(context.Background(), censo2022, 2022)

	if err != nil || pop["SP"] != 44411238 {
		t.Errorf("pop = %v, erro = %v", pop, err)
	}
	if caminho != "/api/v3/agregados/4709/periodos/2022/variaveis/93" {
		t.Errorf("caminho = %s", caminho)
	}
}
