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

func TestGerarMigrationTemAs27UFsENullParaQuemNaoEnviou(t *testing.T) {
	populacao := map[string]int{}
	for _, uf := range UFs {
		populacao[uf] = 1000
	}

	sql := GerarMigration(2024, map[string]int{"SP": 50}, populacao)

	if !strings.HasPrefix(sql, "-- +goose Up\n") || !strings.Contains(sql, "-- +goose Down\nDELETE FROM estatisticas_uf WHERE ano = 2024;") {
		t.Errorf("sql sem goose up/down:\n%s", sql)
	}
	if strings.Count(sql, "  ('") != 27 || !strings.Contains(sql, "('SP', 2024, 50, 1000)") || !strings.Contains(sql, "('RJ', 2024, NULL, 1000)") {
		t.Errorf("valores errados:\n%s", sql)
	}
}
