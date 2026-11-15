package coleta

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestFalaDeFalta(t *testing.T) {
	casos := map[string]bool{
		"Estoque de sangue do Hemoce está em nível crítico":           true,
		"Hemoce faz apelo por doadores de O negativo":                 true,
		"Baixo estoque preocupa hemocentro":                           true,
		"Hemoce lança campanha Junho Vermelho":                        false,
		"Hemoce mobiliza estudantes em campanha que incentiva jovens": false,
	}
	for titulo, quero := range casos {
		if got := FalaDeFalta(titulo); got != quero {
			t.Errorf("%q = %v, quero %v", titulo, got, quero)
		}
	}
}

func TestLerNoticiasWordPressDesfazEntidadesDoTitulo(t *testing.T) {
	noticias, err := lerNoticiasWordPress(`[{"date":"2026-11-10T09:30:00","link":"https://hemo.gov.br/a",
	  "title":{"rendered":"Estoque crítico: Hemo faz &#8220;apelo&#8221; <em>urgente</em>"}}]`)

	if err != nil || len(noticias) != 1 {
		t.Fatalf("noticias = %v, erro = %v", noticias, err)
	}
	if n := noticias[0]; n.Titulo != "Estoque crítico: Hemo faz “apelo” urgente" || n.PublicadaEm.Day() != 10 {
		t.Errorf("notícia = %+v", n)
	}
}

func TestLerNoticiasRSS(t *testing.T) {
	noticias, err := lerNoticiasRSS(`<rss><channel><item><title>Estoque baixo no Hemonorte</title>
	  <link>https://hemonorte.rn.gov.br/x</link><pubDate>Thu, 12 Nov 2026 10:00:00 -0300</pubDate></item></channel></rss>`)

	if err != nil || len(noticias) != 1 || noticias[0].URL != "https://hemonorte.rn.gov.br/x" || noticias[0].PublicadaEm.Month() != time.November {
		t.Errorf("noticias = %+v, erro = %v", noticias, err)
	}
}

func TestColetarNoticiasFicaSoComFaltaRecenteEContinuaSeUmaFonteFalha(t *testing.T) {
	agora := time.Date(2026, 11, 15, 12, 0, 0, 0, time.UTC)
	fontes := []FonteNoticias{
		{ID: "a", UF: "CE", URL: "a", ler: lerNoticiasWordPress},
		{ID: "b", UF: "RN", URL: "b", ler: lerNoticiasWordPress},
	}
	baixar := func(_ context.Context, url string) ([]byte, error) {
		if url == "b" {
			return nil, errors.New("fora do ar")
		}
		return []byte(`[
		  {"date":"2026-11-10T09:30:00","link":"https://ce.gov.br/1","title":{"rendered":"Estoque em alerta"}},
		  {"date":"2026-11-11T09:30:00","link":"https://ce.gov.br/2","title":{"rendered":"Campanha de inverno"}},
		  {"date":"2026-06-01T09:30:00","link":"https://ce.gov.br/3","title":{"rendered":"Estoque crítico"}},
		  {"date":"2026-11-12T09:30:00","link":"javascript:alert(1)","title":{"rendered":"Estoque crítico"}}]`), nil
	}

	noticias, erros := ColetarNoticias(context.Background(), fontes, baixar, agora)

	if len(noticias) != 1 || noticias[0].URL != "https://ce.gov.br/1" || noticias[0].UF != "CE" || noticias[0].FonteID != "a" {
		t.Errorf("noticias = %+v", noticias)
	}
	if erros["b"] == nil {
		t.Error("faltou o erro da fonte b")
	}
}
