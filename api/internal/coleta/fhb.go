package coleta

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"image/png"
	"regexp"
	"strings"
	"time"

	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
)

// A Fundação Hemocentro de Brasília publica o estoque só como imagem: oito gotas, cada uma pintada
// de vermelho até o nível (Baixo, Regular, Adequado). Em vez de OCR, mede quanto de cada gota está
// vermelho numa coluna fixa. Funciona porque a arte tem sempre o mesmo tamanho e a mesma ordem;
// se o tamanho mudar ou alguma gota não for achada, falha em vez de chutar.
const paginaFHB = "https://www.fhb.df.gov.br/estoque-de-sangue"

var imagemFHB = regexp.MustCompile(`/o/adaptive-media/image/\d+/Preview-1000x0/Estoque\+(\d{4}-\d{2}-\d{2})\.png`)

func obterFHB(ctx context.Context, baixar Baixar) ([]byte, error) {
	pagina, err := baixar(ctx, paginaFHB)
	if err != nil {
		return nil, err
	}
	m := imagemFHB.FindSubmatch(pagina)
	if m == nil {
		return nil, errors.New("FHB: imagem do estoque não encontrada na página")
	}
	imagem, err := baixar(ctx, "https://www.fhb.df.gov.br"+string(m[0]))
	if err != nil {
		return nil, err
	}
	// A data só existe no nome do arquivo: vai na primeira linha, antes do PNG.
	return append([]byte(string(m[1])+"\n"), imagem...), nil
}

// Ordem e centro das gotas na arte de 1000 × 1251 px, conferida em 13/11/2026.
var gotasFHB = []struct {
	tipo          httpapi.TipoSanguineo
	x, topo, base int
}{
	{"O+", 133, 360, 610}, {"O-", 348, 360, 610}, {"B+", 563, 360, 610}, {"B-", 778, 360, 610},
	{"AB+", 133, 665, 910}, {"AB-", 348, 665, 910}, {"A+", 563, 665, 910}, {"A-", 778, 665, 910},
}

func vermelho(r, g, b uint32) bool { return r>>8 > 150 && g>>8 < 90 && b>>8 < 100 }

// Cinza opaco do traço da gota (perto de 110, 110, 110).
func contorno(r, g, b, a uint32) bool {
	return a>>8 > 200 && r>>8 > 50 && r>>8 < 150 && max(r, g, b)>>8-min(r, g, b)>>8 < 15
}

// Fração da gota pintada: Baixo ≈ 0,24, Regular ≈ 0,57, Adequado ≈ 0,88 (13/11/2026).
func nivelFHB(fracao float64) httpapi.Nivel {
	switch {
	case fracao >= 0.75:
		return httpapi.Adequado
	case fracao >= 0.4:
		return httpapi.Estavel
	case fracao >= 0.18:
		return httpapi.Alerta
	default:
		return httpapi.Critico
	}
}

func lerFHB(texto string, _ time.Time) (Resultado, error) {
	data, corpo, ok := strings.Cut(texto, "\n")
	if !ok {
		return Resultado{}, errors.New("FHB: resposta sem a data")
	}
	img, err := png.Decode(bytes.NewReader([]byte(corpo)))
	if err != nil {
		return Resultado{}, fmt.Errorf("FHB: %w", err)
	}
	if img.Bounds().Dx() != 1000 || img.Bounds().Dy() != 1251 {
		return Resultado{}, fmt.Errorf("FHB: a arte mudou de tamanho (%v)", img.Bounds().Size())
	}
	var leituras []Leitura
	for _, g := range gotasFHB {
		topo, base, pintado := medirGota(img, g.x, g.topo, g.base)
		if base-topo < 100 {
			return Resultado{}, fmt.Errorf("FHB: gota de %s não encontrada", g.tipo)
		}
		leituras = append(leituras, Leitura{g.tipo, nivelFHB(float64(pintado) / float64(base-topo))})
	}
	return comLeituras("FHB", leituras, data)
}

// Contorno de cima e de baixo da gota na coluna x, e quantos pixels vermelhos há entre eles.
func medirGota(img image.Image, x, de, ate int) (topo, base, pintado int) {
	topo, base = -1, -1
	for y := de; y < ate; y++ {
		r, g, b, a := img.At(x, y).RGBA()
		if contorno(r, g, b, a) {
			if topo < 0 {
				topo = y
			}
			base = y
		}
		if vermelho(r, g, b) {
			pintado++
		}
	}
	return topo, base, pintado
}
