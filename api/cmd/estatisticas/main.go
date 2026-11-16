// Comando estatisticas: gera as migrations com as coletas e o perfil dos doadores por estado
// (Anvisa, Hemoprod) e a população do IBGE.
//
//	go run ./cmd/estatisticas -saida migrations/00016_x.sql [-csv hemoprod_nacional.csv -anos 2022,2023] [bd-hemoprod-AAAA-sat.xlsx...]
//	go run ./cmd/estatisticas -csv hemoprod_nacional.csv -parcial migrations/00017_x.sql
//
// CSV e planilhas: https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/sangue-tecidos-celulas-e-orgaos/producao-e-avaliacao-de-servicos-de-hemoterapia/dados-brutos-de-producao-hemoterapica
package main

import (
	"bytes"
	"context"
	"errors"
	"flag"
	"fmt"
	"maps"
	"net/http"
	"os"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/hemacia/mapa-do-sangue/api/internal/estatisticas"
)

func main() {
	if err := executar(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

var anoNoNome = regexp.MustCompile(`(20\d{2})`)

func executar(args []string) error {
	flags := flag.NewFlagSet("estatisticas", flag.ContinueOnError)
	saida := flags.String("saida", "", "migration com os anos fechados")
	csv := flags.String("csv", "", "hemoprod_nacional.csv")
	anosCSV := flags.String("anos", "", "anos fechados a tirar do CSV, separados por vírgula")
	parcial := flags.String("parcial", "", "migration com o ano em andamento, comparado ao anterior")
	if err := flags.Parse(args); err != nil {
		return err
	}
	ctx, cancelar := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancelar()
	buscar := estatisticas.BuscarNoIBGE(&http.Client{Timeout: time.Minute}, "https://servicodados.ibge.gov.br")

	if *saida != "" {
		totais := estatisticas.Totais{}
		for _, arquivo := range flags.Args() {
			m := anoNoNome.FindString(arquivo)
			if m == "" {
				return fmt.Errorf("sem ano no nome: %s", arquivo)
			}
			ano, _ := strconv.Atoi(m)
			conteudo, err := os.ReadFile(arquivo) //nolint:gosec // ferramenta local
			if err != nil {
				return err
			}
			folhas, err := estatisticas.LerXLSX(conteudo)
			if err != nil {
				return fmt.Errorf("%s: %w", arquivo, err)
			}
			if totais[ano], err = estatisticas.AgregarPlanilhaAnual(folhas); err != nil {
				return fmt.Errorf("%s: %w", arquivo, err)
			}
		}
		if *csv != "" && *anosCSV != "" {
			var anos []int
			for _, a := range strings.Split(*anosCSV, ",") {
				ano, err := strconv.Atoi(strings.TrimSpace(a))
				if err != nil {
					return fmt.Errorf("ano inválido: %s", a)
				}
				anos = append(anos, ano)
			}
			conteudo, err := os.ReadFile(*csv) //nolint:gosec // ferramenta local
			if err != nil {
				return err
			}
			doCSV, err := estatisticas.AgregarPorUF(bytes.NewReader(conteudo), anos, estatisticas.Indicadores)
			if err != nil {
				return err
			}
			maps.Copy(totais, doCSV)
		}
		populacao, err := estatisticas.PopulacaoPorAno(ctx, buscar, slices.Sorted(maps.Keys(totais)))
		if err != nil {
			return err
		}
		if err := os.WriteFile(*saida, []byte(estatisticas.GerarMigration(totais, populacao)), 0o600); err != nil { //nolint:gosec // ferramenta local
			return err
		}
		fmt.Println("gravado em", *saida)
	}

	if *parcial != "" {
		if *csv == "" {
			return errors.New("-parcial precisa do -csv")
		}
		conteudo, err := os.ReadFile(*csv) //nolint:gosec // ferramenta local
		if err != nil {
			return err
		}
		ano := time.Now().Year()
		ufsPorMes := map[string]int{}
		coletas := map[string][]string{"coletas": estatisticas.Indicadores["coletas"]}
		for _, mes := range estatisticas.Meses {
			doMes, err := estatisticas.AgregarMeses(bytes.NewReader(conteudo), []int{ano}, []string{mes}, coletas)
			if err != nil {
				return err
			}
			ufsPorMes[mes] = len(doMes[ano])
		}
		meses := estatisticas.MesesPublicados(ufsPorMes, 15)
		if len(meses) == 0 {
			return fmt.Errorf("nenhum mês de %d publicado ainda", ano)
		}
		comparativo, err := estatisticas.ComparativoMesmoPeriodo(bytes.NewReader(conteudo), ano, meses)
		if err != nil {
			return err
		}
		sql := estatisticas.GerarMigrationParcial(ano, len(meses), comparativo)
		if err := os.WriteFile(*parcial, []byte(sql), 0o600); err != nil { //nolint:gosec // ferramenta local
			return err
		}
		fmt.Printf("gravado em %s (janeiro a %s de %d)\n", *parcial, strings.ToLower(meses[len(meses)-1]), ano)
	}
	if *saida == "" && *parcial == "" {
		return errors.New("informe -saida ou -parcial")
	}
	return nil
}
