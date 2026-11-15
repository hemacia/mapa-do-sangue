package coleta

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"html"
	"regexp"
	"strings"
	"time"
)

// Notícia de estoque baixo publicada pelo hemocentro ou pela secretaria de saúde.
// Não é leitura do estoque: o site mostra como "alerta noticiado", com o link.
type Noticia struct {
	FonteID     string
	UF          string
	Titulo      string
	URL         string
	PublicadaEm time.Time
}

type FonteNoticias struct {
	ID  string
	UF  string
	URL string
	ler func(texto string) ([]Noticia, error)
}

// Só estados sem estoque legível: onde há estoque, o dado vale mais que a notícia.
var FontesNoticias = []FonteNoticias{
	// O Maranhão tem API de notícias, mas o robots.txt proíbe /api/; Amapá e Tocantins só têm busca em HTML.
	{ID: "sesau-al", UF: "AL", URL: "https://www.saude.al.gov.br/feed/?s=hemoal", ler: lerNoticiasRSS},
	{ID: "ses-am", UF: "AM", URL: "https://www.saude.am.gov.br/feed/?s=hemoam", ler: lerNoticiasRSS},
	{ID: "hemoce", UF: "CE", URL: "https://www.hemoce.ce.gov.br/wp-json/wp/v2/posts?search=estoque&per_page=20&_fields=date,link,title", ler: lerNoticiasWordPress},
	{ID: "hemopa", UF: "PA", URL: "https://www.hemopa.pa.gov.br/site/feed/", ler: lerNoticiasRSS},
	{ID: "ses-pe", UF: "PE", URL: "https://portal.saude.pe.gov.br/feed/?s=hemope", ler: lerNoticiasRSS},
	{ID: "sesap-rn", UF: "RN", URL: "https://www.saude.rn.gov.br/wp-json/wp/v2/materia?search=hemonorte&per_page=20&_fields=date,link,title", ler: lerNoticiasWordPress},
	{ID: "governo-ro", UF: "RO", URL: "https://rondonia.ro.gov.br/feed/?s=sangue+estoque", ler: lerNoticiasRSS},
	{ID: "sesau-rr", UF: "RR", URL: "https://saude.rr.gov.br/feed/?s=hemoraima", ler: lerNoticiasRSS},
	{ID: "ses-se", UF: "SE", URL: "https://www.saude.se.gov.br/feed/?s=hemose", ler: lerNoticiasRSS},
}

// Título que fala do estoque baixo, ou um apelo explícito por doação.
var faltaNoTitulo = regexp.MustCompile(`(?i)estoque.*(cr[ií]tic|baix|alerta|reduz|queda|preocup|emerg|abaixo)|` +
	`(cr[ií]tic|baix|alerta|reduz|queda|preocup|emerg).*estoque|\b(apelo|urgente|emergencial)\b`)

func FalaDeFalta(titulo string) bool { return faltaNoTitulo.MatchString(titulo) }

func lerNoticiasWordPress(texto string) ([]Noticia, error) {
	var posts []struct {
		Date  string `json:"date"`
		Link  string `json:"link"`
		Title struct {
			Rendered string `json:"rendered"`
		} `json:"title"`
	}
	if err := json.Unmarshal([]byte(texto), &posts); err != nil {
		return nil, fmt.Errorf("notícias WordPress: %w", err)
	}
	var noticias []Noticia
	for _, p := range posts {
		data, err := time.Parse("2006-01-02T15:04:05", p.Date)
		if err != nil {
			continue
		}
		noticias = append(noticias, Noticia{Titulo: limparTitulo(p.Title.Rendered), URL: p.Link, PublicadaEm: data})
	}
	return noticias, nil
}

func lerNoticiasRSS(texto string) ([]Noticia, error) {
	var rss struct {
		Itens []struct {
			Titulo string `xml:"title"`
			Link   string `xml:"link"`
			Data   string `xml:"pubDate"`
		} `xml:"channel>item"`
	}
	if err := xml.Unmarshal([]byte(texto), &rss); err != nil {
		return nil, fmt.Errorf("notícias RSS: %w", err)
	}
	var noticias []Noticia
	for _, item := range rss.Itens {
		data, err := time.Parse(time.RFC1123Z, strings.TrimSpace(item.Data))
		if err != nil {
			if data, err = time.Parse(time.RFC1123, strings.TrimSpace(item.Data)); err != nil {
				continue
			}
		}
		noticias = append(noticias, Noticia{Titulo: limparTitulo(item.Titulo), URL: strings.TrimSpace(item.Link), PublicadaEm: data})
	}
	return noticias, nil
}

var tagHTML = regexp.MustCompile(`<[^>]*>`)

func limparTitulo(titulo string) string {
	return strings.Join(strings.Fields(html.UnescapeString(tagHTML.ReplaceAllString(titulo, ""))), " ")
}

// ColetarNoticias devolve só as notícias de falta dos últimos 60 dias. Uma fonte fora do ar não para as outras.
func ColetarNoticias(ctx context.Context, fontes []FonteNoticias, baixar Baixar, agora time.Time) ([]Noticia, map[string]error) {
	var todas []Noticia
	erros := map[string]error{}
	for _, f := range fontes {
		corpo, err := baixar(ctx, f.URL)
		if err != nil {
			erros[f.ID] = err
			continue
		}
		noticias, err := f.ler(string(corpo))
		if err != nil {
			erros[f.ID] = err
			continue
		}
		for _, n := range noticias {
			if FalaDeFalta(n.Titulo) && agora.Sub(n.PublicadaEm) <= 60*24*time.Hour && strings.HasPrefix(n.URL, "https://") {
				n.FonteID, n.UF = f.ID, f.UF
				todas = append(todas, n)
			}
		}
	}
	return todas, erros
}
