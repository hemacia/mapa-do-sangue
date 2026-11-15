// Package coleta baixa e lê o estoque publicado por cada hemocentro.
package coleta

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"path"
	"regexp"
	"strconv"
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
	// Só nas fontes que publicam o número de bolsas.
	Bolsas map[httpapi.TipoSanguineo]Contagem
	Erro   error
}

// Minimo é a quantidade a partir da qual a própria fonte considera o estoque fora de risco.
type Contagem struct {
	Bolsas int
	Minimo int
}

type Fonte struct {
	// Mesmo id do hemocentro em migrations/00002_fontes_iniciais.sql.
	ID     string
	URL    string
	latin1 bool
	ler    func(texto string, coletadoEm time.Time) (Resultado, error)
	// Para fonte que não é uma página: substitui o download da URL.
	obter func(ctx context.Context) ([]byte, error)
}

var Fontes = []Fonte{
	{ID: "hemoes", URL: "https://dados.es.gov.br/api/3/action/datastore_search?resource_id=d73f9335-f454-4d1a-bfba-51ed2dac9cb6&sort=_id%20desc&limit=1", ler: lerHemoes},
	{ID: "hemopi", URL: "https://www.hemopi.pi.gov.br/wp-json/wp/v2/posicao-estoque", ler: lerHemopi},
	{ID: "hemominas", URL: "https://www.hemominas.mg.gov.br/", ler: lerHemominas},
	{ID: "unicamp", URL: "https://www.hemocentro.unicamp.br/", ler: lerUnicamp},
	{ID: "hemosc", URL: "https://www.hemosc.org.br/", latin1: true, ler: lerHemosc},
	{ID: "hemoba", URL: "https://www.ba.gov.br/hemoba/", ler: lerHemoba},
	{ID: "prosangue", URL: "https://prosangue.sp.gov.br/reqestoque/posicao_estoque.php", ler: lerProSangue},
	{ID: "rp-ribeirao", URL: "https://docs.google.com/spreadsheets/d/1-RkpABt6glrJbDM1L10PwzWJafpKYdhN_kufyPGH6_M/pubchart?oid=366971640&format=interactive", ler: lerPubchart},
	{ID: "rp-aracatuba", URL: pubchartRP + "1367586318", ler: lerPubchart},
	{ID: "rp-fernandopolis", URL: pubchartRP + "1071427317", ler: lerPubchart},
	{ID: "rp-prudente", URL: pubchartRP + "2092834388", ler: lerPubchart},
	{ID: "rp-taubate", URL: pubchartRP + "796405016", ler: lerPubchart},
	{ID: "hemoacre", URL: "https://www.ac.gov.br/", ler: lerHemoacre},
	{ID: "hemosul", URL: "https://" + servidorHemosul + "/extensions/EstoqueHemosul/EstoqueHemosul.html", ler: lerHemosul, obter: obterHemosul},
}

// Gráficos do Google Planilhas que a página de estoque do Hemocentro de Ribeirão Preto embute, um por cidade.
const pubchartRP = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOAjdsqcyzKT16PBOjSGiZsws6AXUTyDTLhKYfmcnDulgWleyIV-1cVveKLCnOM7uuPzGHFc4GMZx_/pubchart?format=interactive&oid="

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

type limitesProSangue struct{ critico, alerta int }

// Mesma regra do classificarStatus da página: até o limite crítico, depois até o de alerta.
func (l limitesProSangue) nivel(bolsas int) httpapi.Nivel {
	switch {
	case bolsas <= l.critico:
		return httpapi.Critico
	case bolsas <= l.alerta:
		return httpapi.Alerta
	default:
		return httpapi.Estavel
	}
}

var (
	limiteProSangue = regexp.MustCompile(`"(AB|A|B|O)_(positivo|negativo)":\s*\{\s*critico:\s*(\d+),\s*alerta:\s*(\d+),\s*estavel:\s*(\d+)`)
	bolsasProSangue = regexp.MustCompile(`"(AB|A|B|O)([+-])":\s*\{\s*quantidade:\s*(\d+)`)
)

// A Pró-Sangue escreve o estoque num objeto JS (não JSON: tem o literal 01) e classifica no navegador.
// A data da página é new Date(), o relógio de quem visita, então não serve como data da fonte.
func lerProSangue(html string, _ time.Time) (Resultado, error) {
	limites := map[httpapi.TipoSanguineo]limitesProSangue{}
	minimos := map[httpapi.TipoSanguineo]int{}
	for _, m := range limiteProSangue.FindAllStringSubmatch(html, -1) {
		tipo := httpapi.TipoSanguineo(m[1] + map[string]string{"positivo": "+", "negativo": "-"}[m[2]])
		limites[tipo] = limitesProSangue{critico: atoi(m[3]), alerta: atoi(m[4])}
		minimos[tipo] = atoi(m[5])
	}
	var leituras []Leitura
	bolsas := map[httpapi.TipoSanguineo]Contagem{}
	for _, m := range bolsasProSangue.FindAllStringSubmatch(html, -1) {
		tipo := httpapi.TipoSanguineo(m[1] + m[2])
		limite, ok := limites[tipo]
		if _, repetido := bolsas[tipo]; !ok || repetido {
			continue
		}
		quantidade := atoi(m[3])
		leituras = append(leituras, Leitura{tipo, limite.nivel(quantidade)})
		bolsas[tipo] = Contagem{Bolsas: quantidade, Minimo: minimos[tipo]}
	}
	resultado, err := comLeituras("Pró-Sangue", leituras, "")
	resultado.Bolsas = bolsas
	return resultado, err
}

// Abaixo do mínimo de segurança é crítico; até 1,5 vez, alerta; até 2 vezes, estável.
func nivelPeloMinimo(bolsas, minimo int) httpapi.Nivel {
	switch {
	case bolsas < minimo:
		return httpapi.Critico
	case 2*bolsas < 3*minimo:
		return httpapi.Alerta
	case bolsas < 2*minimo:
		return httpapi.Estavel
	default:
		return httpapi.Adequado
	}
}

var chartJSON = regexp.MustCompile(`chartJson': '((?:[^'\\]|\\.)*)'`)

// O gráfico publicado traz um chartJson com escapes \xNN: uma linha por tipo, com bolsas e mínimo.
// A data está no rótulo da coluna de bolsas ("Situação do estoque em 13/11/2026 às 07:15h").
func lerPubchart(html string, _ time.Time) (Resultado, error) {
	m := chartJSON.FindStringSubmatch(html)
	if m == nil {
		return Resultado{}, errors.New("Ribeirão Preto: gráfico sem chartJson") //nolint:staticcheck // nome da cidade
	}
	var grafico struct {
		DataTable struct {
			Cols []struct {
				Label string `json:"label"`
			} `json:"cols"`
			Rows []struct {
				C []*struct {
					V any `json:"v"`
				} `json:"c"`
			} `json:"rows"`
		} `json:"dataTable"`
	}
	if err := json.Unmarshal([]byte(desescaparJS(m[1])), &grafico); err != nil {
		return Resultado{}, fmt.Errorf("Ribeirão Preto: %w", err) //nolint:staticcheck // nome da cidade
	}
	var leituras []Leitura
	bolsas := map[httpapi.TipoSanguineo]Contagem{}
	for _, linha := range grafico.DataTable.Rows {
		if len(linha.C) < 3 || linha.C[0] == nil || linha.C[1] == nil || linha.C[2] == nil {
			continue
		}
		rotulo, _ := linha.C[0].V.(string)
		quantidade, okQ := linha.C[1].V.(float64)
		minimo, okM := linha.C[2].V.(float64)
		tipo, okT := normalizarTipo(rotulo)
		if !okT || !okQ || !okM {
			continue
		}
		leituras = append(leituras, Leitura{tipo, nivelPeloMinimo(int(quantidade), int(minimo))})
		bolsas[tipo] = Contagem{Bolsas: int(quantidade), Minimo: int(minimo)}
	}
	atualizado := ""
	if len(grafico.DataTable.Cols) > 1 {
		atualizado = extrairDataBR(grafico.DataTable.Cols[1].Label)
	}
	resultado, err := comLeituras("Ribeirão Preto", leituras, atualizado)
	resultado.Bolsas = bolsas
	return resultado, err
}

var escapeJS = regexp.MustCompile(`\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|.)`)

// Desfaz os escapes de string JS (\x7b, \u00e7, \/). O resultado é JSON.
func desescaparJS(texto string) string {
	return escapeJS.ReplaceAllStringFunc(texto, func(e string) string {
		switch e[1] {
		case 'x', 'u':
			n, _ := strconv.ParseUint(e[2:], 16, 32)
			return string(rune(n))
		default:
			return e[1:]
		}
	})
}

func atoi(texto string) int {
	n, _ := strconv.Atoi(texto) // só recebe dígitos casados pela regex
	return n
}

// O estoque do Hemoacre fica na home do portal do governo do Acre, sem data.
// A legenda põe "Estável" acima de "Adequado", como na Hemominas.
func lerHemoacre(html string, _ time.Time) (Resultado, error) {
	doc, err := documento(html)
	if err != nil {
		return Resultado{}, err
	}
	var leituras []Leitura
	doc.Find(".hemocentro-estoque .col").Each(func(_ int, cartao *goquery.Selection) {
		tipo, okTipo := normalizarTipo(cartao.Find(".fw-bold").First().Text())
		nivel, okNivel := normalizarNivel(cartao.Find(".nivel .badge small").Text(), escalaHemominas)
		if okTipo && okNivel {
			leituras = append(leituras, Leitura{tipo, nivel})
		}
	})
	return comLeituras("Hemoacre", leituras, "")
}
