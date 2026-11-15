package coleta

import (
	"bytes"
	"context"
	"image"
	"image/png"
	"strings"
	"testing"

	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
)

func TestFHBLeONivelPelaAlturaDoVermelhoEmCadaGota(t *testing.T) {
	r := ler(t, "fhb")

	// Arte de 13/11/2026: O+, B-, AB- e A- "Baixo"; O- "Regular"; B+, AB+ e A+ "Adequado".
	querLeituras(t, r, 8,
		Leitura{"O+", httpapi.Alerta}, Leitura{"O-", httpapi.Estavel}, Leitura{"B+", httpapi.Adequado},
		Leitura{"B-", httpapi.Alerta}, Leitura{"AB+", httpapi.Adequado}, Leitura{"AB-", httpapi.Alerta},
		Leitura{"A+", httpapi.Adequado}, Leitura{"A-", httpapi.Alerta})
	if r.AtualizadoNaFonte != "2026-11-13" {
		t.Errorf("data = %q", r.AtualizadoNaFonte)
	}
}

func TestNivelFHBNasBordas(t *testing.T) {
	for fracao, quero := range map[float64]httpapi.Nivel{
		0.1: httpapi.Critico, 0.18: httpapi.Alerta, 0.4: httpapi.Estavel, 0.75: httpapi.Adequado,
	} {
		if got := nivelFHB(fracao); got != quero {
			t.Errorf("%.2f = %s, quero %s", fracao, got, quero)
		}
	}
}

func TestFHBFalhaQuandoAArteMudaDeTamanho(t *testing.T) {
	var png800 bytes.Buffer
	_ = png.Encode(&png800, image.NewRGBA(image.Rect(0, 0, 800, 1000)))

	_, err := lerFHB("2026-11-13\n"+png800.String(), coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "mudou de tamanho") {
		t.Errorf("erro = %v", err)
	}
}

func TestFHBFalhaQuandoNaoAchaAsGotas(t *testing.T) {
	var branco bytes.Buffer
	_ = png.Encode(&branco, image.NewRGBA(image.Rect(0, 0, 1000, 1251)))

	_, err := lerFHB("2026-11-13\n"+branco.String(), coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "não encontrada") {
		t.Errorf("erro = %v", err)
	}
}

func TestObterFHBAchaAImagemDoDiaNaPagina(t *testing.T) {
	pedidas := []string{}
	baixar := func(_ context.Context, url string) ([]byte, error) {
		pedidas = append(pedidas, url)
		if url == paginaFHB {
			return []byte(`<img src="/o/adaptive-media/image/43509287/Preview-1000x0/Estoque+2026-11-13.png?t=1">`), nil
		}
		return []byte("PNG"), nil
	}

	corpo, err := obterFHB(context.Background(), baixar)

	if err != nil || string(corpo) != "2026-11-13\nPNG" {
		t.Fatalf("corpo = %q, erro = %v", corpo, err)
	}
	if pedidas[1] != "https://www.fhb.df.gov.br/o/adaptive-media/image/43509287/Preview-1000x0/Estoque+2026-11-13.png" {
		t.Errorf("imagem pedida = %s", pedidas[1])
	}
}
