package estatisticas

import (
	"os"
	"testing"
)

func planilha(t *testing.T, nome string) map[string]map[string]int {
	t.Helper()
	conteudo, err := os.ReadFile("testdata/" + nome)
	if err != nil {
		t.Fatal(err)
	}
	folhas, err := LerXLSX(conteudo)
	if err != nil {
		t.Fatal(err)
	}
	totais, err := AgregarPlanilhaAnual(folhas)
	if err != nil {
		t.Fatal(err)
	}
	return totais
}

func TestPlanilhaPivotadaDe2015SomaAsNaturezasEOBlocoDeSP(t *testing.T) {
	totais := planilha(t, "hemoprod-2015.xlsx")

	// SP vem num bloco à parte ("SP*"); os outros somam Privado, Privado-SUS e Público.
	for uf, quero := range map[string]int{"SP": 1078367, "RJ": 419146, "BA": 21439, "MA": 77910} {
		if got := totais[uf]["coletas"]; got != quero {
			t.Errorf("coletas %s = %d, quero %d", uf, got, quero)
		}
	}
	if got := totais["SP"]["primeira_vez"]; got != 412711 {
		t.Errorf("SP primeira vez = %d", got)
	}
	if len(totais) != 27 {
		t.Errorf("UFs = %d, quero 27", len(totais))
	}
}

func TestPlanilhaEmTabelaDe2021(t *testing.T) {
	totais := planilha(t, "hemoprod-2021.xlsx")

	for uf, quero := range map[string]int{"SP": 1022352, "RJ": 418633, "MG": 329043, "BA": 140130} {
		if got := totais[uf]["coletas"]; got != quero {
			t.Errorf("coletas %s = %d, quero %d", uf, got, quero)
		}
	}
	if totais["SP"]["primeira_vez"] == 0 || totais["SP"]["inaptos"] == 0 {
		t.Errorf("SP sem perfil: %v", totais["SP"])
	}
}

func TestPlanilhaSemColetasFalha(t *testing.T) {
	_, err := AgregarPlanilhaAnual([]Folha{{1: {1: "Outra coisa"}}})

	if err == nil {
		t.Error("aceitou planilha sem coletas")
	}
}

func TestLerXLSXRecusaArquivoQueNaoEZip(t *testing.T) {
	if _, err := LerXLSX([]byte("não é xlsx")); err == nil {
		t.Error("aceitou arquivo inválido")
	}
}

func TestReferenciaDaCelula(t *testing.T) {
	for ref, quero := range map[string][2]int{"A1": {1, 1}, "AH41": {34, 41}, "Z9": {26, 9}} {
		col, lin, ok := referencia(ref)
		if !ok || col != quero[0] || lin != quero[1] {
			t.Errorf("%s = %d,%d", ref, col, lin)
		}
	}
	if _, _, ok := referencia("1A"); ok {
		t.Error("aceitou referência inválida")
	}
}
