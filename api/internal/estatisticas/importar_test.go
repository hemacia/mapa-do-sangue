package estatisticas

import (
	"context"
	"os"
	"testing"
)

func TestImportarCSVRecalculaOsAnosFechadosEOParcial(t *testing.T) {
	csv, err := os.ReadFile("testdata/hemoprod-amostra.csv")
	if err != nil {
		t.Fatal(err)
	}
	buscar := func(context.Context, FontePopulacao, int) (map[string]int, error) { return populacaoFixa(1000), nil }

	imp, err := ImportarCSV(context.Background(), csv, 2026, buscar)
	if err != nil {
		t.Fatal(err)
	}
	if imp.Totais[2025]["BA"]["coletas"] != 150 || imp.Populacao[2025]["BA"] != 1000 {
		t.Errorf("2025 = %v", imp.Totais[2025])
	}
	if _, tem := imp.Totais[2023]; tem {
		t.Error("ano sem dado no CSV não pode entrar (apagaria o que já está no banco)")
	}
	if imp.AteMes != 0 {
		t.Errorf("até mês = %d, quero 0: só um estado mandou janeiro", imp.AteMes)
	}
}

func TestImportarCSVFalhaSemNenhumAno(t *testing.T) {
	csv, _ := os.ReadFile("testdata/hemoprod-amostra.csv")

	if _, err := ImportarCSV(context.Background(), csv, 2040, nil); err == nil {
		t.Error("aceitou CSV sem os anos pedidos")
	}
}
