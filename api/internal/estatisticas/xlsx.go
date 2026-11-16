package estatisticas

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"io"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// Folha de uma planilha .xlsx como grade: linha → coluna (1 = A) → texto da célula.
type Folha map[int]map[int]string

// LerXLSX lê as folhas de um .xlsx só com a biblioteca padrão: o arquivo é um zip de XMLs.
// Só o que as planilhas da Anvisa usam: textos compartilhados e números.
func LerXLSX(conteudo []byte) ([]Folha, error) {
	z, err := zip.NewReader(bytes.NewReader(conteudo), int64(len(conteudo)))
	if err != nil {
		return nil, fmt.Errorf("xlsx: %w", err)
	}
	arquivos := map[string]*zip.File{}
	for _, f := range z.File {
		arquivos[f.Name] = f
	}
	var compartilhados []string
	if f, ok := arquivos["xl/sharedStrings.xml"]; ok {
		var sst struct {
			Itens []struct {
				Texto  string `xml:"t"`
				Partes []struct {
					Texto string `xml:"t"`
				} `xml:"r"`
			} `xml:"si"`
		}
		if err := lerXML(f, &sst); err != nil {
			return nil, err
		}
		for _, item := range sst.Itens {
			texto := item.Texto
			for _, p := range item.Partes {
				texto += p.Texto
			}
			compartilhados = append(compartilhados, texto)
		}
	}
	var nomes []string
	for nome := range arquivos {
		if folhaXML.MatchString(nome) {
			nomes = append(nomes, nome)
		}
	}
	sort.Slice(nomes, func(a, b int) bool { return numeroDaFolha(nomes[a]) < numeroDaFolha(nomes[b]) })
	var folhas []Folha
	for _, nome := range nomes {
		var planilha struct {
			Linhas []struct {
				Celulas []struct {
					Ref   string `xml:"r,attr"`
					Tipo  string `xml:"t,attr"`
					Valor string `xml:"v"`
					Livre string `xml:"is>t"`
				} `xml:"c"`
			} `xml:"sheetData>row"`
		}
		if err := lerXML(arquivos[nome], &planilha); err != nil {
			return nil, err
		}
		folha := Folha{}
		for _, linha := range planilha.Linhas {
			for _, c := range linha.Celulas {
				col, lin, ok := referencia(c.Ref)
				if !ok {
					continue
				}
				valor := c.Valor
				switch c.Tipo {
				case "s":
					i, err := strconv.Atoi(valor)
					if err != nil || i < 0 || i >= len(compartilhados) {
						continue
					}
					valor = compartilhados[i]
				case "inlineStr":
					valor = c.Livre
				}
				if valor == "" {
					continue
				}
				if folha[lin] == nil {
					folha[lin] = map[int]string{}
				}
				folha[lin][col] = valor
			}
		}
		folhas = append(folhas, folha)
	}
	return folhas, nil
}

var (
	folhaXML  = regexp.MustCompile(`^xl/worksheets/sheet(\d+)\.xml$`)
	refCelula = regexp.MustCompile(`^([A-Z]+)(\d+)$`)
)

func numeroDaFolha(nome string) int {
	n, _ := strconv.Atoi(folhaXML.FindStringSubmatch(nome)[1])
	return n
}

// "AH41" → coluna 34, linha 41.
func referencia(ref string) (col, lin int, ok bool) {
	m := refCelula.FindStringSubmatch(ref)
	if m == nil {
		return 0, 0, false
	}
	for _, letra := range m[1] {
		col = col*26 + int(letra-'A'+1)
	}
	lin, _ = strconv.Atoi(m[2])
	return col, lin, true
}

func lerXML(f *zip.File, destino any) error {
	r, err := f.Open()
	if err != nil {
		return err
	}
	defer func() { _ = r.Close() }()
	corpo, err := io.ReadAll(io.LimitReader(r, 64<<20))
	if err != nil {
		return err
	}
	return xml.Unmarshal(corpo, destino)
}

// Numero lê o número da célula; vazio ou texto conta como zero (a Anvisa deixa células em branco).
func (f Folha) Numero(lin, col int) int {
	v, err := strconv.ParseFloat(strings.TrimSpace(f[lin][col]), 64)
	if err != nil {
		return 0
	}
	return int(v)
}
