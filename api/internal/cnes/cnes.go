// Package cnes seleciona, entre as unidades de hemoterapia do CNES (tipo 69), as que podem receber doador.
package cnes

import (
	"fmt"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// Estabelecimento como vem da API de dados abertos do Ministério da Saúde (/cnes/estabelecimentos).
type Estabelecimento struct {
	CNES              int      `json:"codigo_cnes"`
	NomeFantasia      string   `json:"nome_fantasia"`
	Endereco          string   `json:"endereco_estabelecimento"`
	Numero            string   `json:"numero_estabelecimento"`
	Bairro            string   `json:"bairro_estabelecimento"`
	Telefone          *string  `json:"numero_telefone_estabelecimento"`
	Latitude          *float64 `json:"latitude_estabelecimento_decimo_grau"`
	Longitude         *float64 `json:"longitude_estabelecimento_decimo_grau"`
	Municipio         int      `json:"codigo_municipio"`
	NaturezaJuridica  *string  `json:"descricao_natureza_juridica_estabelecimento"`
	MotivoDesabilitar *string  `json:"codigo_motivo_desabilitacao_estabelecimento"`
}

type Ponto struct {
	CNES      int
	Nome      string
	UF        string
	Cidade    string
	Endereco  string
	Bairro    string
	Telefone  string
	Latitude  float64
	Longitude float64
	Publico   bool
}

// Agência transfusional fica dentro do hospital e só distribui sangue; laboratório só faz exame.
var naoRecebeDoador = regexp.MustCompile(`\bAGENCIA TRANSFU|^(AT|AG)\b|\bLABORATORIO\b|\bDIAGNOSTICOS?\b`)

// Municipio é o código de 6 dígitos do CNES; municipios vem do IBGE com o código de 7 (com o dígito verificador).
func Selecionar(estabelecimentos []Estabelecimento, municipios map[int]string, ufs map[int]string) []Ponto {
	var pontos []Ponto
	for _, e := range estabelecimentos {
		nome := semAcento(strings.ToUpper(strings.TrimSpace(e.NomeFantasia)))
		if e.MotivoDesabilitar != nil || e.Latitude == nil || e.Longitude == nil || nome == "" || naoRecebeDoador.MatchString(nome) {
			continue
		}
		endereco := nomeProprio(e.Endereco)
		if n := strings.TrimLeft(strings.TrimSpace(e.Numero), "0"); n != "" && n != "S/N" && n != "SN" {
			endereco += ", " + n
		}
		telefone := ""
		if e.Telefone != nil {
			telefone = strings.TrimSpace(*e.Telefone)
		}
		pontos = append(pontos, Ponto{
			CNES:      e.CNES,
			Nome:      nomeProprio(e.NomeFantasia),
			UF:        ufs[e.Municipio/10000],
			Cidade:    municipios[e.Municipio],
			Endereco:  endereco,
			Bairro:    nomeProprio(e.Bairro),
			Telefone:  telefone,
			Latitude:  *e.Latitude,
			Longitude: *e.Longitude,
			// Natureza jurídica 1xxx é administração pública (CONCLA).
			Publico: e.NaturezaJuridica != nil && strings.HasPrefix(*e.NaturezaJuridica, "1"),
		})
	}
	slices.SortFunc(pontos, func(a, b Ponto) int {
		return strings.Compare(a.UF+a.Cidade+a.Nome, b.UF+b.Cidade+b.Nome)
	})
	return pontos
}

func semAcento(texto string) string {
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)))
	resultado, _, _ := transform.String(t, texto)
	return resultado
}

var minusculas = map[string]bool{"DE": true, "DA": true, "DO": true, "DAS": true, "DOS": true, "E": true, "EM": true}

// Siglas que o CNES escreve em maiúsculas e que devem continuar assim.
var siglas = map[string]bool{
	"UFMG": true, "USP": true, "UFU": true, "UFPR": true, "UFRJ": true, "UFPE": true,
	"SUS": true, "HU": true, "HC": true, "UPA": true, "FHB": true, "MT": true, "HMU": true, "SBC": true,
	"RP": true, "SP": true, "RJ": true, "UFSC": true, "UFRN": true, "UFC": true, "UFPI": true, "UERJ": true,
	"II": true, "III": true, "IV": true,
}

// "HEMOCENTRO REGIONAL DE ROLIM DE MOURA" → "Hemocentro Regional de Rolim de Moura".
func nomeProprio(texto string) string {
	palavras := strings.Fields(strings.ToUpper(texto))
	for i, p := range palavras {
		switch {
		case siglas[p]:
		case i > 0 && minusculas[p]:
			palavras[i] = strings.ToLower(p)
		default:
			r := []rune(strings.ToLower(p))
			r[0] = unicode.ToUpper(r[0])
			palavras[i] = string(r)
		}
	}
	return strings.Join(palavras, " ")
}

func texto(s string) string {
	if s == "" {
		return "NULL"
	}
	return "'" + strings.ReplaceAll(s, "'", "''") + "'"
}

// GerarMigration substitui a lista inteira: o CNES é um retrato, não um histórico.
func GerarMigration(pontos []Ponto, data string) string {
	var sql strings.Builder
	fmt.Fprintf(&sql, "-- +goose Up\n-- Unidades de hemoterapia do CNES (tipo 69) que podem receber doador, consultadas em %s.\n", data)
	sql.WriteString("-- Gerado por api/cmd/cnes.\nDELETE FROM pontos_coleta;\n")
	sql.WriteString("INSERT INTO pontos_coleta (cnes, nome, uf, cidade, endereco, bairro, telefone, latitude, longitude, publico) VALUES\n")
	linhas := make([]string, len(pontos))
	for i, p := range pontos {
		linhas[i] = fmt.Sprintf("  (%d, %s, '%s', %s, %s, %s, %s, %s, %s, %t)", p.CNES, texto(p.Nome), p.UF, texto(p.Cidade),
			texto(p.Endereco), texto(p.Bairro), texto(p.Telefone),
			strconv.FormatFloat(p.Latitude, 'f', -1, 64), strconv.FormatFloat(p.Longitude, 'f', -1, 64), p.Publico)
	}
	sql.WriteString(strings.Join(linhas, ",\n"))
	sql.WriteString(";\n\n-- +goose Down\nDELETE FROM pontos_coleta;\n")
	return sql.String()
}
