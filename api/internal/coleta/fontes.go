// Package coleta baixa e lê o estoque publicado por cada hemocentro.
package coleta

import (
	"encoding/json"
	"errors"
	"fmt"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"golang.org/x/text/encoding/charmap"

	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
)

type Resultado struct {
	FonteID  string
	Leituras []Leitura
	// Data (AAAA-MM-DD) ou data e hora local (AAAA-MM-DDTHH:MM) informada pela própria fonte; "" se não houver.
	AtualizadoNaFonte string
	Erro              error
}

type Fonte struct {
	// Mesmo id do hemocentro em migrations/00002_fontes_iniciais.sql.
	ID     string
	URL    string
	latin1 bool
	ler    func(texto string, coletadoEm time.Time) (Resultado, error)
}

var Fontes = []Fonte{
	{ID: "hemoes", URL: "https://dados.es.gov.br/api/3/action/datastore_search?resource_id=d73f9335-f454-4d1a-bfba-51ed2dac9cb6&sort=_id%20desc&limit=1", ler: lerHemoes},
	{ID: "hemopi", URL: "https://www.hemopi.pi.gov.br/wp-json/wp/v2/posicao-estoque", ler: lerHemopi},
	{ID: "hemominas", URL: "https://www.hemominas.mg.gov.br/", ler: lerHemominas},
	{ID: "unicamp", URL: "https://www.hemocentro.unicamp.br/", ler: lerUnicamp},
	{ID: "hemosc", URL: "https://www.hemosc.org.br/", latin1: true, ler: lerHemosc},
	{ID: "hemoba", URL: "https://www.ba.gov.br/hemoba/", ler: lerHemoba},
}

func (f Fonte) decodificar(corpo []byte) string {
	if f.latin1 {
		texto, _ := charmap.ISO8859_1.NewDecoder().Bytes(corpo) // todo byte é válido em latin1
		return string(texto)
	}
	return string(corpo)
}

func comLeituras(fonte string, leituras []Leitura, atualizado string) (Resultado, error) {
	if err := validarLeituras(fonte, leituras); err != nil {
		return Resultado{}, err
	}
	return Resultado{Leituras: leituras, AtualizadoNaFonte: atualizado}, nil
}

func documento(html string) (*goquery.Document, error) {
	return goquery.NewDocumentFromReader(strings.NewReader(html))
}

// API CKAN do portal de dados abertos do ES: um registro por dia, uma coluna por tipo.
func lerHemoes(texto string, coletadoEm time.Time) (Resultado, error) {
	var resposta struct {
		Result struct {
			Records []map[string]any `json:"records"`
		} `json:"result"`
	}
	if err := json.Unmarshal([]byte(texto), &resposta); err != nil {
		return Resultado{}, fmt.Errorf("HEMOES: %w", err)
	}
	if len(resposta.Result.Records) == 0 {
		return Resultado{}, errors.New("HEMOES: API não devolveu nenhum registro")
	}
	registro := resposta.Result.Records[0]
	var leituras []Leitura
	for _, tipo := range []httpapi.TipoSanguineo{"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"} {
		texto, _ := registro[string(tipo)].(string)
		if nivel, ok := normalizarNivel(texto, nil); ok {
			leituras = append(leituras, Leitura{tipo, nivel})
		}
	}
	dataTexto, _ := registro["Data"].(string)
	data, err := interpretarDataAmbigua(dataTexto, coletadoEm)
	if err != nil {
		return Resultado{}, fmt.Errorf("HEMOES: %w", err)
	}
	return comLeituras("HEMOES", leituras, data)
}

var plaqueta = regexp.MustCompile(`(?i)plaqueta`)

// WordPress REST: um único post sobrescrito a cada atualização.
func lerHemopi(texto string, _ time.Time) (Resultado, error) {
	var posts []struct {
		Modified string `json:"modified"`
		Registro map[string]struct {
			Componente string `json:"_componente_sanguineo"`
			Nivel      string `json:"_nivel_estoque"`
		} `json:"registro_estoque"`
	}
	if err := json.Unmarshal([]byte(texto), &posts); err != nil {
		return Resultado{}, fmt.Errorf("Hemopi: %w", err) //nolint:staticcheck // nome do hemocentro
	}
	if len(posts) == 0 {
		return Resultado{}, errors.New("Hemopi: endpoint não devolveu nenhum registro") //nolint:staticcheck // nome do hemocentro
	}
	var leituras []Leitura
	for _, item := range posts[0].Registro {
		// "Plaquetas A+" também tem tipo sanguíneo, mas aqui só entram hemácias.
		if plaqueta.MatchString(item.Componente) {
			continue
		}
		tipo, okTipo := normalizarTipo(item.Componente)
		nivel, okNivel := normalizarNivel(item.Nivel, nil)
		if okTipo && okNivel {
			leituras = append(leituras, Leitura{tipo, nivel})
		}
	}
	modificado := posts[0].Modified
	if len(modificado) > 16 {
		modificado = modificado[:16] // sem os segundos
	}
	return comLeituras("Hemopi", leituras, modificado)
}

// Na legenda da Hemominas "Estável" é o melhor nível ("Aguarde 10 dias para agendar")
// e "Adequado" vem logo abaixo, o contrário da escala comum.
var escalaHemominas = map[string]httpapi.Nivel{"estavel": httpapi.Adequado, "adequado": httpapi.Estavel}

func lerHemominas(html string, _ time.Time) (Resultado, error) {
	doc, err := documento(html)
	if err != nil {
		return Resultado{}, err
	}
	var leituras []Leitura
	doc.Find(".container-estoque-de-sangue-div-2 > div").Each(func(_ int, cartao *goquery.Selection) {
		tipo, okTipo := normalizarTipo(cartao.Find("b").Text())
		nivel, okNivel := normalizarNivel(cartao.Find("p").Text(), escalaHemominas)
		if okTipo && okNivel {
			leituras = append(leituras, Leitura{tipo, nivel})
		}
	})
	return comLeituras("Hemominas", leituras, extrairDataBR(doc.Find(".container-estoque-de-sangue-data").Text()))
}

var ultimaAtualizacao = regexp.MustCompile(`(?i)última atualização`)

func lerUnicamp(html string, _ time.Time) (Resultado, error) {
	doc, err := documento(html)
	if err != nil {
		return Resultado{}, err
	}
	var leituras []Leitura
	doc.Find(".box-card-wrapper").Each(func(_ int, cartao *goquery.Selection) {
		// Os cartões da legenda ("Estável", "Alerta") não têm tipo e ficam de fora aqui.
		tipo, okTipo := normalizarTipo(cartao.Find(".card__small-text").Text())
		// O nível só aparece no nome da imagem: critico.webp, Alerta.webp, Estavel-Ok.webp.
		src, _ := cartao.Find("img.card__small__icon-img").Attr("src")
		nome := strings.FieldsFunc(path.Base(src), func(r rune) bool { return r == '-' || r == '.' })
		if len(nome) == 0 {
			return
		}
		nivel, okNivel := normalizarNivel(nome[0], nil)
		if okTipo && okNivel {
			leituras = append(leituras, Leitura{tipo, nivel})
		}
	})
	atualizado := ""
	doc.Find("p").EachWithBreak(func(_ int, p *goquery.Selection) bool {
		if ultimaAtualizacao.MatchString(p.Text()) {
			atualizado = extrairDataBR(p.Text())
			return false
		}
		return true
	})
	return comLeituras("Unicamp", leituras, atualizado)
}

// Escala do Hemosc, da melhor para a pior: Adequado, Estável, Reduzido, Alerta.
var escalaHemosc = map[string]httpapi.Nivel{"alerta": httpapi.Critico}

func lerHemosc(html string, _ time.Time) (Resultado, error) {
	doc, err := documento(html)
	if err != nil {
		return Resultado{}, err
	}
	var leituras []Leitura
	vistos := map[httpapi.TipoSanguineo]bool{}
	doc.Find(".tudo_home_estq img[alt]").Each(func(_ int, imagem *goquery.Selection) {
		alt, _ := imagem.Attr("alt")
		titulo, _ := imagem.Attr("title")
		tipo, okTipo := normalizarTipo(alt)
		// O title é "Estável - Continue doando...": o nível vem antes do traço.
		nivel, okNivel := normalizarNivel(strings.SplitN(titulo, " - ", 2)[0], escalaHemosc)
		// A página repete o bloco inteiro (versões para celular e desktop).
		if okTipo && okNivel && !vistos[tipo] {
			vistos[tipo] = true
			leituras = append(leituras, Leitura{tipo, nivel})
		}
	})
	return comLeituras("Hemosc", leituras, "")
}

func lerHemoba(html string, _ time.Time) (Resultado, error) {
	doc, err := documento(html)
	if err != nil {
		return Resultado{}, err
	}
	var leituras []Leitura
	doc.Find(".bagov-card-item__content-mini").Each(func(_ int, cartao *goquery.Selection) {
		tipo, okTipo := normalizarTipo(cartao.Find(".bagov-card-item__title").Text())
		nivel, okNivel := normalizarNivel(cartao.Find(".bagov-card-item__description").Text(), nil)
		if okTipo && okNivel {
			leituras = append(leituras, Leitura{tipo, nivel})
		}
	})
	// A página não informa quando o estoque foi atualizado.
	return comLeituras("Hemoba", leituras, "")
}
