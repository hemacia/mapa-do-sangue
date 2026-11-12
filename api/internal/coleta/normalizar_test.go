package coleta

import (
	"testing"
	"time"

	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
)

func TestNormalizarNivelReconheceSinonimos(t *testing.T) {
	casos := map[string]httpapi.Nivel{
		"Crítico": httpapi.Critico, "CRITICO": httpapi.Critico, "Emergência": httpapi.Critico,
		"Alerta": httpapi.Alerta, "Reduzido": httpapi.Alerta, "Regular": httpapi.Alerta,
		"Estável": httpapi.Estavel, "Adequado": httpapi.Adequado, "  estável \n": httpapi.Estavel,
	}
	for texto, esperado := range casos {
		got, ok := normalizarNivel(texto, nil)

		if !ok || got != esperado {
			t.Errorf("normalizarNivel(%q) = %q, quero %q", texto, got, esperado)
		}
	}
}

func TestNormalizarNivelDevolveFalsoParaTextoDesconhecido(t *testing.T) {
	_, ok := normalizarNivel("Carregando...", nil)

	if ok {
		t.Error("aceitou um nível que não existe")
	}
}

func TestNormalizarNivelAplicaAEscalaDaFonteAntesDoPadrao(t *testing.T) {
	escala := map[string]httpapi.Nivel{"alerta": httpapi.Critico}

	alerta, _ := normalizarNivel("Alerta", escala)
	reduzido, _ := normalizarNivel("Reduzido", escala)

	if alerta != httpapi.Critico || reduzido != httpapi.Alerta {
		t.Errorf("alerta = %q, reduzido = %q", alerta, reduzido)
	}
}

func TestNormalizarTipoReconheceAsGrafiasDosHemocentros(t *testing.T) {
	casos := map[string]httpapi.TipoSanguineo{
		"A+": "A+", "ab-": "AB-", "O –": "O-", "B positivo": "B+", "AB NEGATIVO": "AB-",
		"Sangue tipo O-": "O-", "Tipo A Neg": "A-", "AB+": "AB+",
	}
	for texto, esperado := range casos {
		got, ok := normalizarTipo(texto)

		if !ok || got != esperado {
			t.Errorf("normalizarTipo(%q) = %q, quero %q", texto, got, esperado)
		}
	}
}

func TestNormalizarTipoRecusaTextoSemTipoOuSemRh(t *testing.T) {
	for _, texto := range []string{"Plaquetas", "Tipo A"} {
		if tipo, ok := normalizarTipo(texto); ok {
			t.Errorf("normalizarTipo(%q) = %q, quero nada", texto, tipo)
		}
	}
}

func TestInterpretarDataAmbiguaEscolheADataMaisProximaSemPassarDaColeta(t *testing.T) {
	coleta := time.Date(2026, 11, 10, 12, 0, 0, 0, time.UTC)
	casos := map[string]string{
		"10/11/2026": "2026-11-10", // ler como 11 de outubro daria uma data mais antiga
		"11/10/2026": "2026-11-10", // formato americano, mesmo dia
		"29/03/2026": "2026-03-29", // só uma leitura é válida
		"3/4/2026":   "2026-04-03",
	}
	for texto, esperado := range casos {
		got, err := interpretarDataAmbigua(texto, coleta)

		if err != nil || got != esperado {
			t.Errorf("interpretarDataAmbigua(%q) = %q, %v, quero %q", texto, got, err, esperado)
		}
	}
}

func TestInterpretarDataAmbiguaFalhaComTextoInvalido(t *testing.T) {
	for _, texto := range []string{"ontem", "31/31/2026"} {
		if _, err := interpretarDataAmbigua(texto, time.Now()); err == nil {
			t.Errorf("aceitou %q", texto)
		}
	}
}

func TestExtrairDataBR(t *testing.T) {
	casos := map[string]string{
		"Atualizado em 10/11/2026 12:35": "2026-11-10T12:35",
		"Última atualização: 10/11/2026": "2026-11-10",
		"sem data":                       "",
		"99/99/2026":                     "",
	}
	for texto, esperado := range casos {
		if got := extrairDataBR(texto); got != esperado {
			t.Errorf("extrairDataBR(%q) = %q, quero %q", texto, got, esperado)
		}
	}
}

func TestValidarLeituras(t *testing.T) {
	if err := validarLeituras("teste", []Leitura{{"O-", httpapi.Critico}, {"A+", httpapi.Estavel}}); err != nil {
		t.Errorf("recusou leituras válidas: %v", err)
	}
	if err := validarLeituras("teste", nil); err == nil || err.Error() != "teste: nenhuma leitura encontrada" {
		t.Errorf("lista vazia: %v", err)
	}
	if err := validarLeituras("teste", []Leitura{{"O-", httpapi.Critico}, {"O-", httpapi.Alerta}}); err == nil ||
		err.Error() != "teste: tipo O- repetido" {
		t.Errorf("tipo repetido: %v", err)
	}
}
