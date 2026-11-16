package estatisticas

import (
	"bytes"
	"context"
	"fmt"
	"maps"
	"slices"
)

// URL fixa do CSV nacional da Anvisa; o arquivo é substituído a cada publicação.
const URLHemoprod = "https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica-1/hemoprod_nacional.csv/@@download/file"

// Importacao é o que a atualização mensal grava no banco.
type Importacao struct {
	Totais      Totais
	Populacao   map[int]map[string]int
	AnoParcial  int
	AteMes      int
	Comparativo map[string][2]int // UF → [ano anterior, ano parcial], mesmas unidades
}

// ImportarCSV recalcula os três anos fechados antes de anoAtual (a Anvisa ainda corrige envios
// antigos) e o comparativo do ano atual, se algum mês já saiu.
func ImportarCSV(ctx context.Context, csv []byte, anoAtual int, buscar BuscarPopulacao) (Importacao, error) {
	anos := []int{anoAtual - 3, anoAtual - 2, anoAtual - 1}
	totais, err := AgregarPorUF(bytes.NewReader(csv), anos, Indicadores)
	if err != nil {
		return Importacao{}, err
	}
	for _, ano := range anos {
		if len(totais[ano]) == 0 {
			delete(totais, ano) // ano que a Anvisa ainda não publicou não pode apagar o que já existe
		}
	}
	if len(totais) == 0 {
		return Importacao{}, fmt.Errorf("o CSV não tem nenhum dos anos %v", anos)
	}
	populacao, err := PopulacaoPorAno(ctx, buscar, slices.Sorted(maps.Keys(totais)))
	if err != nil {
		return Importacao{}, err
	}
	imp := Importacao{Totais: totais, Populacao: populacao, AnoParcial: anoAtual}
	ufsPorMes := map[string]int{}
	coletas := map[string][]string{"coletas": Indicadores["coletas"]}
	for _, mes := range Meses {
		doMes, err := AgregarMeses(bytes.NewReader(csv), []int{anoAtual}, []string{mes}, coletas)
		if err != nil {
			return Importacao{}, err
		}
		ufsPorMes[mes] = len(doMes[anoAtual])
	}
	if meses := MesesPublicados(ufsPorMes, 15); len(meses) > 0 {
		imp.AteMes = len(meses)
		if imp.Comparativo, err = ComparativoMesmoPeriodo(bytes.NewReader(csv), anoAtual, meses); err != nil {
			return Importacao{}, err
		}
	}
	return imp, nil
}
