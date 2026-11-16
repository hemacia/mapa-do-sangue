package estatisticas

import (
	"errors"
	"maps"
	"slices"
	"strings"
)

// Planilhas anuais antigas da Anvisa (bd-hemoprod-AAAA-sat.xlsx), já somadas por estado.
// 2010 a 2018: tabela pivotada, uma linha por indicador e natureza, uma coluna por estado, e
// SP num bloco à parte ("SP*", sem natureza). 2019 a 2021: uma linha por estado e natureza.

// Mesmos indicadores do CSV nacional. Inaptos somam primeira vez, repetição e esporádico.
var indicadoresDaPlanilha = map[string]map[string]string{
	"APTOS": {
		"1ª Vez": "primeira_vez", "Repetição": "repeticao", "Esporádico": "esporadico",
		"Espontâneo": "espontanea", "Reposição": "reposicao", "Masculino": "masculino",
		"Feminino": "feminino", "18 à 29 anos": "ate_29_anos", "Acima 29": "acima_29_anos",
	},
	"INAPTOS":          {"1ª Vez": "inaptos", "Repetição": "inaptos", "Esporádico": "inaptos"},
	"TOTAL DE COLETAS": {"Sangue Tot": "coletas", "Por Aférese": "coletas"},
}

func indicadorDe(grupo, rotulo string) (string, bool) {
	nome, ok := indicadoresDaPlanilha[strings.ToUpper(strings.TrimSpace(grupo))][strings.TrimSpace(rotulo)]
	return nome, ok
}

// AgregarPlanilhaAnual soma os indicadores de cada estado numa planilha anual antiga.
func AgregarPlanilhaAnual(folhas []Folha) (map[string]map[string]int, error) {
	totais := map[string]map[string]int{}
	somar := func(uf, indicador string, valor int) {
		if totais[uf] == nil {
			totais[uf] = map[string]int{}
		}
		totais[uf][indicador] += valor
	}
	if len(folhas) > 0 && ehTabela(folhas[0]) {
		agregarTabela(folhas[0], somar)
	} else {
		for _, f := range folhas {
			agregarPivot(f, somar)
		}
	}
	if len(totais) == 0 {
		return nil, errors.New("planilha sem coletas por estado: o formato mudou")
	}
	return totais, nil
}

func ehTabela(f Folha) bool {
	temUF, temColetas := false, false
	for _, v := range f[1] {
		temUF = temUF || strings.TrimSpace(v) == "UF"
		temColetas = temColetas || strings.TrimSpace(v) == "Coletas Sangue Tot"
	}
	return temUF && temColetas
}

func agregarTabela(f Folha, somar func(uf, indicador string, valor int)) {
	colUF := 0
	colunas := map[int]string{}
	for col, nome := range f[1] {
		nome = strings.TrimSpace(nome)
		switch {
		case nome == "UF":
			colUF = col
		case strings.HasPrefix(nome, "Coletas "):
			if ind, ok := indicadorDe("TOTAL DE COLETAS", strings.TrimPrefix(nome, "Coletas ")); ok {
				colunas[col] = ind
			}
		case strings.HasPrefix(nome, "Apto "):
			if ind, ok := indicadorDe("APTOS", strings.TrimPrefix(nome, "Apto ")); ok {
				colunas[col] = ind
			}
		case strings.HasPrefix(nome, "Inapto "):
			if ind, ok := indicadorDe("INAPTOS", strings.TrimPrefix(nome, "Inapto ")); ok {
				colunas[col] = ind
			}
		}
	}
	for lin, linha := range f {
		uf := strings.TrimSpace(linha[colUF])
		if lin == 1 || nomes[uf] == "" {
			continue
		}
		for col, ind := range colunas {
			somar(uf, ind, f.Numero(lin, col))
		}
	}
}

func ufDoCabecalho(texto string) (uf string, semNatureza bool) {
	texto = strings.TrimSpace(texto)
	semNatureza = strings.HasSuffix(texto, "*")
	uf = strings.TrimSuffix(texto, "*")
	if nomes[uf] == "" {
		return "", false
	}
	return uf, semNatureza
}

func linhasOrdenadas(f Folha) []int { return slices.Sorted(maps.Keys(f)) }

func agregarPivot(f Folha, somar func(uf, indicador string, valor int)) {
	linhas := linhasOrdenadas(f)
	for _, cab := range linhas {
		for colNatureza, texto := range f[cab] {
			if strings.ToUpper(strings.TrimSpace(texto)) != "NATUREZA" {
				continue
			}
			// Colunas de estado do bloco: à direita de NATUREZA, sem os blocos "SP*" (tratados abaixo).
			ufs := map[int]string{}
			for col, t := range f[cab] {
				if uf, semNatureza := ufDoCabecalho(t); col > colNatureza && uf != "" && !semNatureza {
					ufs[col] = uf
				}
			}
			grupo, rotulo := "", ""
			for _, lin := range linhas {
				if lin <= cab {
					continue
				}
				if strings.ToUpper(strings.TrimSpace(f[lin][colNatureza])) == "NATUREZA" {
					break
				}
				if g := f[lin][colNatureza-2]; g != "" {
					grupo, rotulo = g, f[lin][colNatureza-1]
				} else if r := f[lin][colNatureza-1]; r != "" {
					rotulo = r
				}
				if ind, ok := indicadorDe(grupo, rotulo); ok {
					for col, uf := range ufs {
						somar(uf, ind, f.Numero(lin, col))
					}
				}
			}
		}
		// Bloco sem natureza: cabeçalho "SP*" em cima da coluna do rótulo; o valor fica à direita.
		for col, texto := range f[cab] {
			uf, semNatureza := ufDoCabecalho(texto)
			if uf == "" || !semNatureza {
				continue
			}
			grupo, rotulo := "", ""
			for _, lin := range linhas {
				if lin <= cab {
					continue
				}
				if g := f[lin][col-1]; g != "" {
					if strings.HasPrefix(strings.TrimSpace(g), "*") {
						break
					}
					grupo, rotulo = g, f[lin][col]
				} else if r := f[lin][col]; r != "" {
					rotulo = r
				}
				if ind, ok := indicadorDe(grupo, rotulo); ok {
					somar(uf, ind, f.Numero(lin, col+1))
				}
			}
		}
	}
}
