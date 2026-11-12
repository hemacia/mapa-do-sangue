package coleta

import (
	"fmt"
	"math"
	"regexp"
	"strings"
	"time"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"

	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
)

type Leitura struct {
	Tipo  httpapi.TipoSanguineo
	Nivel httpapi.Nivel
}

var sinonimos = map[string]httpapi.Nivel{
	"critico": httpapi.Critico, "emergencia": httpapi.Critico,
	"alerta": httpapi.Alerta, "reduzido": httpapi.Alerta, "regular": httpapi.Alerta, "baixo": httpapi.Alerta,
	"estavel": httpapi.Estavel, "adequado": httpapi.Adequado,
}

func semAcento(texto string) string {
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)))
	resultado, _, _ := transform.String(t, texto)
	return resultado
}

// Cada hemocentro dá um sentido diferente às palavras: no Hemosc "Alerta" é o pior nível,
// então a escala da fonte vale antes dos sinônimos.
func normalizarNivel(texto string, escala map[string]httpapi.Nivel) (httpapi.Nivel, bool) {
	chave := strings.ToLower(strings.TrimSpace(semAcento(texto)))
	if nivel, ok := escala[chave]; ok {
		return nivel, true
	}
	nivel, ok := sinonimos[chave]
	return nivel, ok
}

// Hemocentros escrevem "O-", "O –", "O negativo", "Sangue tipo O NEG"...
var padraoTipo = regexp.MustCompile(`(?i)\b(AB|A|B|O)\s*(\+|-|–|−|POS(?:ITIVO)?\b|NEG(?:ATIVO)?\b)`)

func normalizarTipo(texto string) (httpapi.TipoSanguineo, bool) {
	partes := padraoTipo.FindStringSubmatch(texto)
	if partes == nil {
		return "", false
	}
	rh := "-"
	if p := strings.ToUpper(partes[2]); p == "+" || strings.HasPrefix(p, "POS") {
		rh = "+"
	}
	return httpapi.TipoSanguineo(strings.ToUpper(partes[1]) + rh), true
}

// Página que mudou de layout costuma devolver lista vazia em vez de dar erro:
// melhor falhar alto do que gravar um estoque inventado.
func validarLeituras(fonte string, leituras []Leitura) error {
	if len(leituras) == 0 {
		return fmt.Errorf("%s: nenhuma leitura encontrada", fonte)
	}
	vistos := map[httpapi.TipoSanguineo]bool{}
	for _, l := range leituras {
		if vistos[l.Tipo] {
			return fmt.Errorf("%s: tipo %s repetido", fonte, l.Tipo)
		}
		vistos[l.Tipo] = true
	}
	return nil
}

var dataBarras = regexp.MustCompile(`^(\d{1,2})/(\d{1,2})/(\d{4})$`)

// O registro do HEMOES mistura "29/03/2026" com "03/29/2026" na mesma coluna: vale a
// leitura válida mais próxima da coleta, e uma data no futuro só se for a única válida.
func interpretarDataAmbigua(texto string, coletadoEm time.Time) (string, error) {
	partes := dataBarras.FindStringSubmatch(strings.TrimSpace(texto))
	if partes == nil {
		return "", fmt.Errorf("data inválida: %s", texto)
	}
	melhor := ""
	var menorDistancia time.Duration
	for _, diaMes := range [][2]string{{partes[1], partes[2]}, {partes[2], partes[1]}} {
		data, err := time.Parse("2006-1-2", partes[3]+"-"+diaMes[1]+"-"+diaMes[0])
		if err != nil {
			continue
		}
		distancia := coletadoEm.Sub(data)
		if distancia < 0 {
			distancia = math.MaxInt64
		}
		if melhor == "" || distancia < menorDistancia {
			melhor, menorDistancia = data.Format(time.DateOnly), distancia
		}
	}
	if melhor == "" {
		return "", fmt.Errorf("data inválida: %s", texto)
	}
	return melhor, nil
}

var dataBR = regexp.MustCompile(`(\d{2})/(\d{2})/(\d{4})(?:\s+(\d{2}:\d{2}))?`)

// Devolve AAAA-MM-DD ou AAAA-MM-DDTHH:MM no horário local da fonte, ou "" sem data válida.
func extrairDataBR(texto string) string {
	partes := dataBR.FindStringSubmatch(texto)
	if partes == nil {
		return ""
	}
	data := partes[3] + "-" + partes[2] + "-" + partes[1]
	if _, err := time.Parse(time.DateOnly, data); err != nil {
		return ""
	}
	if partes[4] != "" {
		return data + "T" + partes[4]
	}
	return data
}
