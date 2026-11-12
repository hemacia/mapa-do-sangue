package coleta

import (
	"os"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
)

var coletadoEm = time.Date(2026, 11, 10, 12, 0, 0, 0, time.UTC)

// Páginas reais salvas em testdata: os testes nunca acessam a internet.
func fixture(t *testing.T, nome string) []byte {
	t.Helper()
	bytes, err := os.ReadFile("testdata/" + nome)
	if err != nil {
		t.Fatal(err)
	}
	return bytes
}

func ler(t *testing.T, id string) Resultado {
	t.Helper()
	i := slices.IndexFunc(Fontes, func(f Fonte) bool { return f.ID == id })
	resultado, err := Fontes[i].ler(Fontes[i].decodificar(fixture(t, Fontes[i].fixture())), coletadoEm)
	if err != nil {
		t.Fatal(err)
	}
	return resultado
}

func (f Fonte) fixture() string {
	if f.ID == "hemoes" || f.ID == "hemopi" {
		return f.ID + ".json"
	}
	return f.ID + ".html"
}

func querLeituras(t *testing.T, r Resultado, total int, esperadas ...Leitura) {
	t.Helper()
	if len(r.Leituras) != total {
		t.Errorf("leituras = %d, quero %d: %v", len(r.Leituras), total, r.Leituras)
	}
	for _, l := range esperadas {
		if !slices.Contains(r.Leituras, l) {
			t.Errorf("faltou %v em %v", l, r.Leituras)
		}
	}
}

func TestHemoesLeOsOitoTiposDoRegistroMaisRecente(t *testing.T) {
	r := ler(t, "hemoes")

	querLeituras(t, r, 8, Leitura{"O-", httpapi.Critico}, Leitura{"AB+", httpapi.Alerta})
	if r.AtualizadoNaFonte != "2026-11-10" {
		t.Errorf("data = %q", r.AtualizadoNaFonte)
	}
}

func TestHemoesFalhaQuandoAAPINaoDevolveRegistro(t *testing.T) {
	_, err := lerHemoes(`{"success":true,"result":{"records":[]}}`, coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "HEMOES") {
		t.Errorf("erro = %v", err)
	}
}

func TestHemopiLeSoAsHemaciasEConverteRegularParaAlerta(t *testing.T) {
	r := ler(t, "hemopi")

	querLeituras(t, r, 8, Leitura{"O+", httpapi.Critico}, Leitura{"O-", httpapi.Alerta})
	if r.AtualizadoNaFonte != "2026-11-10T10:41" {
		t.Errorf("data = %q, quero sem os segundos", r.AtualizadoNaFonte)
	}
}

func TestHemopiFalhaComListaVazia(t *testing.T) {
	_, err := lerHemopi("[]", coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "Hemopi") {
		t.Errorf("erro = %v", err)
	}
}

func TestHemominasInverteEstavelEAdequado(t *testing.T) {
	r := ler(t, "hemominas")

	querLeituras(t, r, 8,
		Leitura{"O+", httpapi.Critico}, Leitura{"B+", httpapi.Alerta},
		Leitura{"AB+", httpapi.Adequado}, Leitura{"AB-", httpapi.Estavel})
	if r.AtualizadoNaFonte != "2026-11-10T12:35" {
		t.Errorf("data = %q", r.AtualizadoNaFonte)
	}
}

func TestHemominasFalhaSemOBlocoDeEstoque(t *testing.T) {
	_, err := lerHemominas("<html><body>Manutenção</body></html>", coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "Hemominas") {
		t.Errorf("erro = %v", err)
	}
}

func TestUnicampLeONivelPeloNomeDaImagemEIgnoraALegenda(t *testing.T) {
	r := ler(t, "unicamp")

	querLeituras(t, r, 8,
		Leitura{"O+", httpapi.Critico}, Leitura{"A+", httpapi.Estavel}, Leitura{"O-", httpapi.Alerta})
	if r.AtualizadoNaFonte != "2026-11-10" {
		t.Errorf("data = %q", r.AtualizadoNaFonte)
	}
}

func TestUnicampFalhaSemCartoes(t *testing.T) {
	_, err := lerUnicamp("<html></html>", coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "Unicamp") {
		t.Errorf("erro = %v", err)
	}
}

func TestHemoscDecodificaLatin1EUsaAEscalaPropria(t *testing.T) {
	r := ler(t, "hemosc")

	// Alerta é o pior nível no Hemosc; a página repete o bloco, mas cada tipo entra uma vez.
	querLeituras(t, r, 8,
		Leitura{"A-", httpapi.Estavel}, Leitura{"O-", httpapi.Critico}, Leitura{"O+", httpapi.Alerta})
	if r.AtualizadoNaFonte != "" {
		t.Errorf("data = %q, a página não publica", r.AtualizadoNaFonte)
	}
}

func TestHemobaLeOsOitoCartoes(t *testing.T) {
	r := ler(t, "hemoba")

	querLeituras(t, r, 8, Leitura{"O-", httpapi.Critico}, Leitura{"A+", httpapi.Estavel})
}

func TestHemobaFalhaComAPaginaDeDesafioAntiRobo(t *testing.T) {
	_, err := lerHemoba("<html><body><script>checando navegador</script></body></html>", coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "Hemoba") {
		t.Errorf("erro = %v", err)
	}
}

func TestCadaFonteTemCadastroNaMigration(t *testing.T) {
	migration, err := os.ReadFile("../../migrations/00002_fontes_iniciais.sql")
	if err != nil {
		t.Fatal(err)
	}
	fontes := string(migration[strings.Index(string(migration), "INSERT INTO fontes"):])

	for _, f := range Fontes {
		if !strings.Contains(fontes, "('"+f.ID+"', '"+f.ID+"', '") {
			t.Errorf("fonte %s sem cadastro em 00002_fontes_iniciais.sql", f.ID)
		}
	}
}
