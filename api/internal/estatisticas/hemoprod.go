// Package estatisticas agrega as coletas por estado do CSV nacional da Anvisa (Hemoprod).
package estatisticas

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"io"
	"maps"
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
	colID          = "ID da resposta"
	colEnvio       = "Data de envio"
	colAno         = "Ano de referência"
	colPeriodo     = "Período de referência"
	colNome        = "Razão Social - Nome Fantasia"
	colCNPJ        = "CNPJ"
	colSangueTotal = "3.3\u00a0Total de coletas [Sangue total]"
	colAferese     = "3.3\u00a0Total de coletas [Por aférese]"
	colUF          = "Unidade Federativa"
)

// Indicadores por UF: cada um soma as colunas cujo nome contém um dos trechos (um trecho, uma coluna).
// Os doadores contam só os candidatos aptos, que são os que de fato doaram.
var Indicadores = map[string][]string{
	"coletas":       {colSangueTotal, colAferese},
	"primeira_vez":  {"[Primeira vez][Aptos]"},
	"repeticao":     {"[Repetição][Aptos]"},
	"esporadico":    {"[Esporádico][Aptos]"},
	"espontanea":    {"[Espontânea][Aptos]"},
	"reposicao":     {"[Reposição][Aptos]"},
	"feminino":      {"[Feminino][Aptos]"},
	"masculino":     {"[Masculino][Aptos]"},
	"ate_29_anos":   {"[Menor de 18 anos][Aptos]", "[18 até 29 anos][Aptos]"},
	"acima_29_anos": {"[Acima de 29 anos][Aptos]"},
	"inaptos":       {"[Primeira vez][Inaptos]", "[Repetição][Inaptos]", "[Esporádico][Inaptos]"},
	"tipo_A+":       {"Imunohematologia [A+][Doador]"},
	"tipo_A-":       {"Imunohematologia [A-][Doador]"},
	"tipo_B+":       {"Imunohematologia [B+][Doador]"},
	"tipo_B-":       {"Imunohematologia [B-][Doador]"},
	"tipo_AB+":      {"Imunohematologia [AB+][Doador]"},
	"tipo_AB-":      {"Imunohematologia [AB-][Doador]"},
	"tipo_O+":       {"Imunohematologia [O+][Doador]"},
	"tipo_O-":       {"Imunohematologia [O-][Doador]"},
}

// Totais por ano, UF e indicador. Uma UF só aparece no ano em que algum estabelecimento dela enviou dados.
type Totais map[int]map[string]map[string]int

func AgregarColetasPorUF(r io.Reader, ano int) (map[string]int, error) {
	totais, err := AgregarPorUF(r, []int{ano}, map[string][]string{"coletas": Indicadores["coletas"]})
	if err != nil {
		return nil, err
	}
	coletas := map[string]int{}
	for uf, ind := range totais[ano] {
		coletas[uf] = ind["coletas"]
	}
	return coletas, nil
}

func localizarColuna(cabecalho []string, trecho string) (int, error) {
	// "Razão Social - Nome Fantasia" também é o começo de "Razão Social - Nome Fantasia  [Outros]".
	if i := slices.Index(cabecalho, trecho); i >= 0 {
		return i, nil
	}
	encontrada := -1
	for i, nome := range cabecalho {
		if strings.Contains(nome, trecho) {
			if encontrada >= 0 {
				return 0, fmt.Errorf("mais de uma coluna com %q", trecho)
			}
			encontrada = i
		}
	}
	if encontrada < 0 {
		return 0, fmt.Errorf("coluna não encontrada: %s", trecho)
	}
	return encontrada, nil
}

func AgregarPorUF(r io.Reader, anos []int, indicadores map[string][]string) (Totais, error) {
	return agregarFiltrado(r, anos, indicadores, nil, false)
}

// AgregarMeses soma só os envios mensais dos meses pedidos ("Janeiro", "Fevereiro"...). Quem manda
// só o consolidado anual (SP, RJ e parte de MG) fica de fora, nos dois anos comparados.
func AgregarMeses(r io.Reader, anos []int, meses []string, indicadores map[string][]string) (Totais, error) {
	return agregarFiltrado(r, anos, indicadores, func(periodo string) bool { return slices.Contains(meses, periodo) }, false)
}

// porUnidade troca a UF pela chave "UF|CNPJ|nome|período", para comparar unidade a unidade.
func agregarFiltrado(r io.Reader, anos []int, indicadores map[string][]string, aceitarPeriodo func(string) bool, porUnidade bool) (Totais, error) {
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
	for _, nome := range []string{colEnvio, colAno, colPeriodo, colNome, colCNPJ, colUF} {
		if col[nome], err = localizarColuna(linhas[0], nome); err != nil {
			return nil, err
		}
	}
	col[colID] = slices.Index(linhas[0], colID) // opcional: os testes antigos não têm
	colunasDe := map[string][]int{}
	for indicador, trechos := range indicadores {
		for _, trecho := range trechos {
			i, err := localizarColuna(linhas[0], trecho)
			if err != nil {
				return nil, err
			}
			colunasDe[indicador] = append(colunasDe[indicador], i)
		}
	}
	campo := func(linha []string, i int) string {
		if i < len(linha) {
			return linha[i]
		}
		return ""
	}
	estabelecimento := func(linha []string) string {
		return campo(linha, col[colAno]) + "|" + campo(linha, col[colCNPJ]) + "|" + campo(linha, col[colNome])
	}

	// Retificações e duplicatas: vale o envio mais recente de cada estabelecimento e período.
	ultimoEnvio := map[string][]string{}
	for n, linha := range linhas[1:] {
		ano, _ := strconv.Atoi(campo(linha, col[colAno]))
		if !slices.Contains(anos, ano) || (aceitarPeriodo != nil && !aceitarPeriodo(campo(linha, col[colPeriodo]))) {
			continue
		}
		chave := estabelecimento(linha) + "|" + campo(linha, col[colPeriodo])
		// ID 0 é linha agregada pela própria Anvisa (o RJ manda a rede inteira assim, 18 linhas com o
		// mesmo nome "Rede de serviços"): não é reenvio, então cada linha vale por si.
		if col[colID] >= 0 && campo(linha, col[colID]) == "0" {
			chave += "|linha " + strconv.Itoa(n)
		}
		if anterior, ok := ultimoEnvio[chave]; !ok || campo(linha, col[colEnvio]) > campo(anterior, col[colEnvio]) {
			ultimoEnvio[chave] = linha
		}
	}

	// SP, RJ e MG mandam um "Consolidado" anual: quando existe, os meses são ignorados.
	comConsolidado := map[string]bool{}
	for _, linha := range ultimoEnvio {
		if campo(linha, col[colPeriodo]) == "Consolidado" {
			comConsolidado[estabelecimento(linha)] = true
		}
	}

	totais := Totais{}
	for _, linha := range ultimoEnvio {
		if comConsolidado[estabelecimento(linha)] && campo(linha, col[colPeriodo]) != "Consolidado" {
			continue
		}
		uf := SiglaDaUF(campo(linha, col[colUF]))
		if uf == "" {
			continue
		}
		ano, _ := strconv.Atoi(campo(linha, col[colAno]))
		if porUnidade {
			uf = strings.Join([]string{uf, campo(linha, col[colCNPJ]), campo(linha, col[colNome]), campo(linha, col[colPeriodo])}, "|")
		}
		if totais[ano] == nil {
			totais[ano] = map[string]map[string]int{}
		}
		if totais[ano][uf] == nil {
			totais[ano][uf] = map[string]int{}
		}
		for indicador, colunas := range colunasDe {
			for _, i := range colunas {
				n, _ := strconv.Atoi(strings.TrimSpace(campo(linha, i))) // vazio conta como zero
				totais[ano][uf][indicador] += n
			}
		}
	}
	return totais, nil
}

// GerarMigration monta a migration goose com as coletas e a população de cada UF em cada ano
// (NULL = estado sem nenhum envio) e os indicadores dos doadores. Reaplicar atualiza os valores.
func GerarMigration(totais Totais, populacao map[int]map[string]int) string {
	anos := slices.Sorted(maps.Keys(populacao))
	listaAnos := strings.Trim(strings.Join(strings.Fields(fmt.Sprint(anos)), ", "), "[]")
	var sql strings.Builder
	fmt.Fprintf(&sql, "-- +goose Up\n-- Anvisa, Hemoprod %s, e população estimada pelo IBGE.\n", listaAnos)
	sql.WriteString("-- Gerado por api/cmd/estatisticas. NULL = estado sem nenhum envio no ano.\n")
	sql.WriteString("INSERT INTO estatisticas_uf (uf, ano, coletas, populacao) VALUES\n")
	var linhas []string
	for _, ano := range anos {
		for _, uf := range UFs {
			valor := "NULL"
			if ind, ok := totais[ano][uf]; ok {
				valor = strconv.Itoa(ind["coletas"])
			}
			linhas = append(linhas, fmt.Sprintf("  ('%s', %d, %s, %d)", uf, ano, valor, populacao[ano][uf]))
		}
	}
	sql.WriteString(strings.Join(linhas, ",\n"))
	sql.WriteString("\nON CONFLICT (uf, ano) DO UPDATE SET coletas = EXCLUDED.coletas, populacao = EXCLUDED.populacao;\n\n")

	linhas = nil
	for _, ano := range anos {
		for _, uf := range UFs {
			ind := totais[ano][uf]
			for _, nome := range slices.Sorted(maps.Keys(ind)) {
				if nome != "coletas" {
					linhas = append(linhas, fmt.Sprintf("  ('%s', %d, '%s', %d)", uf, ano, nome, ind[nome]))
				}
			}
		}
	}
	if len(linhas) > 0 {
		sql.WriteString("INSERT INTO indicadores_uf (uf, ano, indicador, valor) VALUES\n")
		sql.WriteString(strings.Join(linhas, ",\n"))
		sql.WriteString(";\n")
	}
	fmt.Fprintf(&sql, "\n-- +goose Down\nDELETE FROM indicadores_uf WHERE ano IN (%s);\nDELETE FROM estatisticas_uf WHERE ano IN (%s);\n", listaAnos, listaAnos)
	return sql.String()
}

var Meses = []string{"Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto",
	"Setembro", "Outubro", "Novembro", "Dezembro"}

// MesesPublicados devolve os meses do ano já publicados em sequência desde janeiro: um mês só
// conta quando pelo menos minimoUFs estados o enviaram (a Anvisa solta o ano aos poucos).
func MesesPublicados(ufsPorMes map[string]int, minimoUFs int) []string {
	var meses []string
	for _, mes := range Meses {
		if ufsPorMes[mes] < minimoUFs {
			break
		}
		meses = append(meses, mes)
	}
	return meses
}

// GerarMigrationParcial grava as coletas do ano em andamento até o último mês publicado, ao lado
// das do mesmo período do ano anterior, pelas mesmas unidades (ComparativoMesmoPeriodo).
func GerarMigrationParcial(ano, ateMes int, comparativo map[string][2]int) string {
	var sql strings.Builder
	fmt.Fprintf(&sql, "-- +goose Up\n-- Coletas de janeiro a %s de %d e do mesmo período de %d (Anvisa, Hemoprod, envios mensais).\n",
		strings.ToLower(Meses[ateMes-1]), ano, ano-1)
	sql.WriteString("-- Gerado por api/cmd/estatisticas. SP, RJ e quem manda só o consolidado anual ficam de fora.\n")
	sql.WriteString("DELETE FROM parcial_uf;\n")
	var linhas []string
	for _, uf := range UFs {
		b, a := comparativo[uf][0], comparativo[uf][1]
		if a > 0 && b > 0 {
			linhas = append(linhas, fmt.Sprintf("  ('%s', %d, %d, %d, %d)", uf, ano, ateMes, a, b))
		}
	}
	if len(linhas) > 0 {
		sql.WriteString("INSERT INTO parcial_uf (uf, ano, ate_mes, coletas, coletas_ano_anterior) VALUES\n")
		sql.WriteString(strings.Join(linhas, ",\n") + ";\n")
	}
	sql.WriteString("\n-- +goose Down\nDELETE FROM parcial_uf;\n")
	return sql.String()
}

// ComparativoMesmoPeriodo soma as coletas de cada UF nos meses pedidos do ano e do ano anterior,
// contando só as unidades que mandaram todos esses meses nos dois anos. Assim uma unidade que ainda
// não enviou 2026 não parece uma queda. Devolve UF → [ano anterior, ano].
func ComparativoMesmoPeriodo(r io.Reader, ano int, meses []string) (map[string][2]int, error) {
	porUnidade, err := agregarFiltrado(r, []int{ano - 1, ano}, map[string][]string{"coletas": Indicadores["coletas"]},
		func(periodo string) bool { return slices.Contains(meses, periodo) }, true)
	if err != nil {
		return nil, err
	}
	type unidade struct{ uf, id string }
	mesesDe := map[int]map[unidade]int{}
	coletasDe := map[int]map[unidade]int{}
	for _, a := range []int{ano - 1, ano} {
		mesesDe[a], coletasDe[a] = map[unidade]int{}, map[unidade]int{}
		for chave, ind := range porUnidade[a] {
			partes := strings.SplitN(chave, "|", 4)
			u := unidade{partes[0], partes[1] + "|" + partes[2]}
			mesesDe[a][u]++
			coletasDe[a][u] += ind["coletas"]
		}
	}
	comparativo := map[string][2]int{}
	for u, n := range mesesDe[ano] {
		if n != len(meses) || mesesDe[ano-1][u] != len(meses) {
			continue
		}
		c := comparativo[u.uf]
		comparativo[u.uf] = [2]int{c[0] + coletasDe[ano-1][u], c[1] + coletasDe[ano][u]}
	}
	return comparativo, nil
}
