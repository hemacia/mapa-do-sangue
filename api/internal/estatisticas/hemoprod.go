// Package estatisticas agrega as coletas por estado do CSV nacional da Anvisa (Hemoprod).
package estatisticas

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"io"
	"slices"
	"strconv"
	"strings"
)

var nomes = map[string]string{
	"AC": "Acre", "AL": "Alagoas", "AM": "Amazonas", "AP": "Amapá", "BA": "Bahia", "CE": "Ceará",
	"DF": "Distrito Federal", "ES": "Espírito Santo", "GO": "Goiás", "MA": "Maranhão", "MG": "Minas Gerais",
	"MS": "Mato Grosso do Sul", "MT": "Mato Grosso", "PA": "Pará", "PB": "Paraíba", "PE": "Pernambuco",
	"PI": "Piauí", "PR": "Paraná", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte", "RO": "Rondônia",
	"RR": "Roraima", "RS": "Rio Grande do Sul", "SC": "Santa Catarina", "SE": "Sergipe", "SP": "São Paulo",
	"TO": "Tocantins",
}

var UFs = slices.Sorted(func(yield func(string) bool) {
	for uf := range nomes {
		if !yield(uf) {
			return
		}
	}
})

// SiglaDaUF converte o nome do estado ("São Paulo") na sigla, ou "" se não reconhecer.
func SiglaDaUF(nome string) string {
	procurado := strings.ToLower(strings.TrimSpace(nome))
	for uf, n := range nomes {
		if strings.ToLower(n) == procurado {
			return uf
		}
	}
	return ""
}

// Colunas do CSV, localizadas pelo nome. Nas de coletas, o espaço depois de "3.3" é um NBSP.
const (
	colEnvio       = "Data de envio"
	colAno         = "Ano de referência"
	colPeriodo     = "Período de referência"
	colNome        = "Razão Social - Nome Fantasia"
	colCNPJ        = "CNPJ"
	colSangueTotal = "3.3\u00a0Total de coletas [Sangue total]"
	colAferese     = "3.3\u00a0Total de coletas [Por aférese]"
	colUF          = "Unidade Federativa"
)

func AgregarColetasPorUF(r io.Reader, ano int) (map[string]int, error) {
	leitor := bufio.NewReader(r)
	if bom, _ := leitor.Peek(3); string(bom) == "\xef\xbb\xbf" {
		_, _ = leitor.Discard(3)
	}
	csvLeitor := csv.NewReader(leitor)
	csvLeitor.Comma = ';'
	csvLeitor.FieldsPerRecord = -1
	linhas, err := csvLeitor.ReadAll()
	if err != nil {
		return nil, err
	}
	if len(linhas) == 0 {
		return nil, fmt.Errorf("CSV vazio")
	}
	col := map[string]int{}
	for _, nome := range []string{colEnvio, colAno, colPeriodo, colNome, colCNPJ, colSangueTotal, colAferese, colUF} {
		i := slices.Index(linhas[0], nome)
		if i < 0 {
			return nil, fmt.Errorf("coluna não encontrada: %s", nome)
		}
		col[nome] = i
	}
	campo := func(linha []string, nome string) string {
		if col[nome] < len(linha) {
			return linha[col[nome]]
		}
		return ""
	}
	estabelecimento := func(linha []string) string { return campo(linha, colCNPJ) + "|" + campo(linha, colNome) }

	// Retificações e duplicatas: vale o envio mais recente de cada estabelecimento e período.
	ultimoEnvio := map[string][]string{}
	for _, linha := range linhas[1:] {
		if campo(linha, colAno) != strconv.Itoa(ano) {
			continue
		}
		chave := estabelecimento(linha) + "|" + campo(linha, colPeriodo)
		if anterior, ok := ultimoEnvio[chave]; !ok || campo(linha, colEnvio) > campo(anterior, colEnvio) {
			ultimoEnvio[chave] = linha
		}
	}

	// SP, RJ e MG mandam um "Consolidado" anual: quando existe, os meses são ignorados.
	comConsolidado := map[string]bool{}
	for _, linha := range ultimoEnvio {
		if campo(linha, colPeriodo) == "Consolidado" {
			comConsolidado[estabelecimento(linha)] = true
		}
	}

	total := map[string]int{}
	for _, linha := range ultimoEnvio {
		if comConsolidado[estabelecimento(linha)] && campo(linha, colPeriodo) != "Consolidado" {
			continue
		}
		uf := SiglaDaUF(campo(linha, colUF))
		if uf == "" {
			continue
		}
		sangue, _ := strconv.Atoi(strings.TrimSpace(campo(linha, colSangueTotal))) // vazio conta como zero
		aferese, _ := strconv.Atoi(strings.TrimSpace(campo(linha, colAferese)))
		total[uf] += sangue + aferese
	}
	return total, nil
}

// GerarMigration monta a migration goose com uma linha por UF; NULL = estado sem nenhum envio no ano.
func GerarMigration(ano int, coletas, populacao map[string]int) string {
	var sql strings.Builder
	fmt.Fprintf(&sql, "-- +goose Up\n-- Coletas (sangue total + aférese): Anvisa, Hemoprod %d. População: IBGE, estimativa %d.\n", ano, ano)
	sql.WriteString("-- Gerado por api/cmd/estatisticas. NULL = estado sem nenhum envio no ano.\n")
	sql.WriteString("INSERT INTO estatisticas_uf (uf, ano, coletas, populacao) VALUES\n")
	for i, uf := range UFs {
		valor := "NULL"
		if c, ok := coletas[uf]; ok {
			valor = strconv.Itoa(c)
		}
		separador := ",\n"
		if i == len(UFs)-1 {
			separador = ";\n"
		}
		fmt.Fprintf(&sql, "  ('%s', %d, %s, %d)%s", uf, ano, valor, populacao[uf], separador)
	}
	fmt.Fprintf(&sql, "\n-- +goose Down\nDELETE FROM estatisticas_uf WHERE ano = %d;\n", ano)
	return sql.String()
}
