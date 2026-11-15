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
	if f.ID == "hemoes" || f.ID == "hemopi" || f.ID == "hemosul" {
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

func TestProSangueClassificaAsBolsasPelosLimitesDaPropriaPagina(t *testing.T) {
	r := ler(t, "prosangue")

	// O- 25 bolsas (crítico até 68); A+ 1257 (estável a partir de 364); AB- vem como o literal 01.
	querLeituras(t, r, 8, Leitura{"O-", httpapi.Critico}, Leitura{"A+", httpapi.Estavel}, Leitura{"AB-", httpapi.Critico})
	if got := r.Bolsas["O-"]; got != (Contagem{Bolsas: 25, Minimo: 103}) {
		t.Errorf("bolsas O- = %+v", got)
	}
	if r.AtualizadoNaFonte != "" {
		t.Errorf("data = %q, a página mostra o relógio de quem visita", r.AtualizadoNaFonte)
	}
}

func TestProSangueClassificaNasBordasDosLimites(t *testing.T) {
	limites := limitesProSangue{critico: 68, alerta: 102}

	for bolsas, quero := range map[int]httpapi.Nivel{68: httpapi.Critico, 69: httpapi.Alerta, 102: httpapi.Alerta, 103: httpapi.Estavel} {
		if got := limites.nivel(bolsas); got != quero {
			t.Errorf("%d bolsas = %s, quero %s", bolsas, got, quero)
		}
	}
}

func TestProSangueFalhaSemOObjetoDeDados(t *testing.T) {
	_, err := lerProSangue("<html><script>const x = {}</script></html>", coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "Pró-Sangue") {
		t.Errorf("erro = %v", err)
	}
}

func TestRibeiraoPretoLeBolsasEMinimoDoGraficoPublicado(t *testing.T) {
	r := ler(t, "rp-ribeirao")

	// O- 23 contra mínimo 61; O+ 311 contra 302 (abaixo de 1,5×); AB+ 108 contra 13.
	querLeituras(t, r, 8, Leitura{"O-", httpapi.Critico}, Leitura{"O+", httpapi.Alerta}, Leitura{"AB+", httpapi.Adequado})
	if got := r.Bolsas["O-"]; got != (Contagem{Bolsas: 23, Minimo: 61}) {
		t.Errorf("bolsas O- = %+v", got)
	}
	if r.AtualizadoNaFonte != "2026-11-13T07:15" {
		t.Errorf("data = %q", r.AtualizadoNaFonte)
	}
}

func TestRedeRibeiraoPretoTemUmaFontePorCidade(t *testing.T) {
	for _, id := range []string{"rp-aracatuba", "rp-fernandopolis", "rp-prudente", "rp-taubate"} {
		r := ler(t, id)
		if len(r.Leituras) != 8 || len(r.Bolsas) != 8 || r.AtualizadoNaFonte == "" {
			t.Errorf("%s: %d leituras, %d bolsas, data %q", id, len(r.Leituras), len(r.Bolsas), r.AtualizadoNaFonte)
		}
	}
}

func TestNivelPeloMinimoDeSeguranca(t *testing.T) {
	casos := []struct {
		bolsas, minimo int
		quero          httpapi.Nivel
	}{
		{0, 3, httpapi.Critico}, {60, 61, httpapi.Critico}, {61, 61, httpapi.Alerta},
		{91, 61, httpapi.Alerta}, {92, 61, httpapi.Estavel}, {122, 61, httpapi.Adequado},
		{4, 0, httpapi.Adequado},
	}
	for _, c := range casos {
		if got := nivelPeloMinimo(c.bolsas, c.minimo); got != c.quero {
			t.Errorf("%d de %d = %s, quero %s", c.bolsas, c.minimo, got, c.quero)
		}
	}
}

func TestRibeiraoPretoFalhaSemOGrafico(t *testing.T) {
	_, err := lerPubchart("<html>Este gráfico foi removido</html>", coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "Ribeirão Preto") {
		t.Errorf("erro = %v", err)
	}
}

func TestHemoacreLeOsOitoTiposComAEscalaInvertida(t *testing.T) {
	r := ler(t, "hemoacre")

	// Na legenda do Acre, Estável é o melhor nível e Adequado vem logo abaixo.
	querLeituras(t, r, 8, Leitura{"O-", httpapi.Critico}, Leitura{"A-", httpapi.Alerta},
		Leitura{"AB-", httpapi.Adequado}, Leitura{"B+", httpapi.Estavel})
}

func TestHemoacreFalhaSemOBlocoDeEstoque(t *testing.T) {
	_, err := lerHemoacre("<html><body>Portal do Acre</body></html>", coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "Hemoacre") {
		t.Errorf("erro = %v", err)
	}
}

func TestCadaFonteTemCadastroNaMigration(t *testing.T) {
	var cadastros strings.Builder
	for _, arquivo := range []string{"00002_fontes_iniciais.sql", "00004_fontes_sao_paulo.sql", "00005_hemosul.sql", "00011_hemoacre.sql"} {
		migration, err := os.ReadFile("../../migrations/" + arquivo)
		if err != nil {
			t.Fatal(err)
		}
		cadastros.WriteString(string(migration[strings.Index(string(migration), "INSERT INTO fontes"):]))
	}

	for _, f := range Fontes {
		if !strings.Contains(cadastros.String(), "('"+f.ID+"', '"+f.ID+"', '") {
			t.Errorf("fonte %s sem cadastro nas migrations", f.ID)
		}
	}
}
