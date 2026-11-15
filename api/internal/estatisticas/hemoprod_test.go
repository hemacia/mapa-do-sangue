package estatisticas

import (
	"maps"
	"strings"
	"testing"
)

const cabecalho = "Data de envio;Ano de referência;Período de referência;Razão Social - Nome Fantasia;CNPJ;" +
	"3.3\u00a0Total de coletas [Sangue total];3.3\u00a0Total de coletas [Por aférese];Unidade Federativa"

func linha(envio, ano, periodo, nome, total, aferese, uf string) string {
	return strings.Join([]string{envio, ano, periodo, nome, "00.000.000/0001-00", total, aferese, uf}, ";")
}

func agregar(t *testing.T, ano int, linhas ...string) map[string]int {
	t.Helper()
	total, err := AgregarColetasPorUF(strings.NewReader(strings.Join(append([]string{cabecalho}, linhas...), "\n")), ano)
	if err != nil {
		t.Fatal(err)
	}
	return total
}

func quero(t *testing.T, got, esperado map[string]int) {
	t.Helper()
	if !maps.Equal(got, esperado) {
		t.Errorf("total = %v, quero %v", got, esperado)
	}
}

func TestSomaSangueTotalEAfereseDeTodosOsMeses(t *testing.T) {
	got := agregar(t, 2024,
		linha("2024-02-01", "2024", "Janeiro", "Hemo A", "100", "5", "Espírito Santo"),
		linha("2024-03-01", "2024", "Fevereiro", "Hemo A", "200", "0", "Espírito Santo"))

	quero(t, got, map[string]int{"ES": 305})
}

func TestIgnoraOutrosAnos(t *testing.T) {
	got := agregar(t, 2024, linha("2023-02-01", "2023", "Janeiro", "Hemo A", "100", "0", "Bahia"))

	quero(t, got, map[string]int{})
}

func TestFicaComOEnvioMaisRecenteDoMesmoMes(t *testing.T) {
	got := agregar(t, 2024,
		linha("2024-02-01", "2024", "Janeiro", "Hemo A", "100", "0", "Bahia"),
		linha("2024-05-01", "2024", "Janeiro", "Hemo A", "120", "0", "Bahia"))

	quero(t, got, map[string]int{"BA": 120})
}

func TestUsaOConsolidadoAnualEIgnoraOsMeses(t *testing.T) {
	got := agregar(t, 2024,
		linha("2025-01-10", "2024", "Consolidado", "Hemo SP", "1000", "0", "São Paulo"),
		linha("2024-02-01", "2024", "Janeiro", "Hemo SP", "90", "0", "São Paulo"))

	quero(t, got, map[string]int{"SP": 1000})
}

func TestTrataCampoVazioComoZero(t *testing.T) {
	got := agregar(t, 2024, linha("2024-02-01", "2024", "Janeiro", "Hemo A", "", "7", "Pará"))

	quero(t, got, map[string]int{"PA": 7})
}

func TestAceitaBOMAspasEQuebraDeLinhaDentroDoCampo(t *testing.T) {
	texto := "\xef\xbb\xbf" + cabecalho + "\r\n" +
		linha("2024-02-01", "2024", "Janeiro", "\"Hemo \"\"A\"\";\nfilial\"", "10", "0", "Acre")

	got, err := AgregarColetasPorUF(strings.NewReader(texto), 2024)
	if err != nil {
		t.Fatal(err)
	}
	quero(t, got, map[string]int{"AC": 10})
}

func TestFalhaQuandoFaltaUmaColuna(t *testing.T) {
	_, err := AgregarColetasPorUF(strings.NewReader("a;b\n1;2"), 2024)

	if err == nil || !strings.Contains(err.Error(), "coluna não encontrada") {
		t.Errorf("erro = %v", err)
	}
}

func TestSiglaDaUF(t *testing.T) {
	if SiglaDaUF(" são paulo ") != "SP" || SiglaDaUF("Distrito Federal") != "DF" || SiglaDaUF("Atlântida") != "" {
		t.Error("sigla errada")
	}
}

func TestGerarMigrationTemAs27UFsPorAnoENullParaQuemNaoEnviou(t *testing.T) {
	populacao := map[int]map[string]int{2024: {}, 2025: {}}
	for _, uf := range UFs {
		populacao[2024][uf], populacao[2025][uf] = 1000, 1100
	}
	totais := Totais{2025: {"SP": {"coletas": 50, "primeira_vez": 20}}}

	sql := GerarMigration(totais, populacao)

	if !strings.HasPrefix(sql, "-- +goose Up\n") || !strings.Contains(sql, "-- +goose Down\nDELETE FROM indicadores_uf WHERE ano IN (2024, 2025);") {
		t.Errorf("sql sem goose up/down:\n%s", sql)
	}
	for _, trecho := range []string{"('SP', 2025, 50, 1100)", "('SP', 2024, NULL, 1000)", "('SP', 2025, 'primeira_vez', 20)", "ON CONFLICT (uf, ano) DO UPDATE"} {
		if !strings.Contains(sql, trecho) {
			t.Errorf("faltou %s:\n%s", trecho, sql)
		}
	}
	if strings.Count(sql, "', 202") != 54+1 {
		t.Errorf("quero 54 linhas de coletas e 1 de indicador:\n%s", sql)
	}
}

func TestAgregarPorUFSomaCadaIndicadorPorAno(t *testing.T) {
	cabecalho := "Data de envio;Ano de referência;Período de referência;Razão Social - Nome Fantasia;CNPJ;Unidade Federativa;" +
		"2.2 Total de candidatos quanto ao tipo de doador  [Primeira vez][Aptos];4.2 Imunohematologia [O-][Doador]"
	csv := strings.Join([]string{cabecalho,
		"2025-02-01;2025;Janeiro;Hemo A;1;Bahia;10;3",
		"2025-03-01;2025;Fevereiro;Hemo A;1;Bahia;5;",
		"2024-02-01;2024;Janeiro;Hemo A;1;Bahia;7;1",
	}, "\n")

	totais, err := AgregarPorUF(strings.NewReader(csv), []int{2024, 2025},
		map[string][]string{"primeira_vez": {"[Primeira vez][Aptos]"}, "tipo_O-": {"[O-][Doador]"}})

	if err != nil {
		t.Fatal(err)
	}
	if got := totais[2025]["BA"]; got["primeira_vez"] != 15 || got["tipo_O-"] != 3 {
		t.Errorf("2025 = %v", got)
	}
	if got := totais[2024]["BA"]["primeira_vez"]; got != 7 {
		t.Errorf("2024 = %d", got)
	}
}

func TestAgregarPorUFRecusaTrechoQueCasaDuasColunas(t *testing.T) {
	cabecalho := "Data de envio;Ano de referência;Período de referência;Razão Social - Nome Fantasia;CNPJ;Unidade Federativa;2.2 [A][Aptos];2.3 [A][Aptos]"

	_, err := AgregarPorUF(strings.NewReader(cabecalho), []int{2025}, map[string][]string{"x": {"[A][Aptos]"}})

	if err == nil || !strings.Contains(err.Error(), "mais de uma coluna") {
		t.Errorf("erro = %v", err)
	}
}

func TestSomaCadaLinhaAgregadaDaAnvisaSemDeduplicar(t *testing.T) {
	cabecalho := "ID da resposta;Data de envio;Ano de referência;Período de referência;Razão Social - Nome Fantasia;CNPJ;Unidade Federativa;" +
		"3.3\u00a0Total de coletas [Sangue total];3.3\u00a0Total de coletas [Por aférese]"
	csv := strings.Join([]string{cabecalho,
		"0;0;2025;Consolidado;Rede de serviços;0;Rio de Janeiro;80327;0",
		"0;0;2025;Consolidado;Rede de serviços;0;Rio de Janeiro;76055;10",
		"7;2026-01-10;2025;Consolidado;Hemo B;1;Rio de Janeiro;5;0",
		"8;2026-02-10;2025;Consolidado;Hemo B;1;Rio de Janeiro;6;0",
	}, "\n")

	got, err := AgregarColetasPorUF(strings.NewReader(csv), 2025)

	if err != nil {
		t.Fatal(err)
	}
	// As duas linhas de ID 0 somam; o Hemo B reenviou e vale só o último envio.
	quero(t, got, map[string]int{"RJ": 80327 + 76055 + 10 + 6})
}
