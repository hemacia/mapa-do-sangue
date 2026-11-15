// Package store implementa httpapi.Repositorio sobre o PostgreSQL.
package store

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"sort"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/hemacia/mapa-do-sangue/api/internal/coleta"
	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
	"github.com/hemacia/mapa-do-sangue/api/migrations"
)

type Store struct {
	pool  *pgxpool.Pool
	agora func() time.Time
}

func Novo(pool *pgxpool.Pool, agora func() time.Time) *Store {
	return &Store{pool: pool, agora: agora}
}

// Migrar aplica as migrations embutidas que ainda não rodaram.
func Migrar(ctx context.Context, pool *pgxpool.Pool) error {
	db := stdlib.OpenDBFromPool(pool)
	defer func() { _ = db.Close() }()
	return migrarDB(ctx, db)
}

func migrarDB(ctx context.Context, db *sql.DB) error {
	provider, err := goose.NewProvider(goose.DialectPostgres, db, migrations.FS)
	if err != nil {
		return err
	}
	_, err = provider.Up(ctx)
	return err
}

func (s *Store) Ping(ctx context.Context) error { return s.pool.Ping(ctx) }

// Última leitura de cada hemocentro, com o histórico de 30 dias de cada tipo.
const consultaEstoqueAtual = `
  SELECT h.id, h.nome, h.uf, h.cidade, h.latitude, h.longitude,
         l.tipo::text, l.nivel::text, l.atualizado_na_fonte, l.coletado_em, l.bolsas, l.bolsas_minimo
  FROM leituras_estoque l
  JOIN hemocentros h ON h.id = l.hemocentro_id
  WHERE l.coletado_em = (SELECT max(coletado_em) FROM leituras_estoque WHERE hemocentro_id = l.hemocentro_id)
    AND ($1 = '' OR h.uf = $1)
  ORDER BY h.uf, h.nome, l.tipo`

// Conta dias distintos, não coletas: a coleta roda duas vezes por dia.
const consultaHistorico = `
  SELECT hemocentro_id, tipo::text,
         count(DISTINCT (coletado_em AT TIME ZONE 'America/Sao_Paulo')::date),
         count(DISTINCT (coletado_em AT TIME ZONE 'America/Sao_Paulo')::date) FILTER (WHERE nivel = 'critico')
  FROM leituras_estoque
  WHERE coletado_em >= $1
  GROUP BY hemocentro_id, tipo`

var gravidade = map[httpapi.Nivel]int{httpapi.Critico: 0, httpapi.Alerta: 1, httpapi.Estavel: 2, httpapi.Adequado: 3}

func (s *Store) EstoqueAtual(ctx context.Context, uf string) ([]httpapi.EstoqueHemocentro, error) {
	linhas, err := s.pool.Query(ctx, consultaEstoqueAtual, uf)
	if err != nil {
		return nil, fmt.Errorf("consultar estoque: %w", err)
	}
	defer linhas.Close()
	var lista []httpapi.EstoqueHemocentro
	indice := map[string]int{}
	for linhas.Next() {
		var h httpapi.EstoqueHemocentro
		var tipo string
		var nivel httpapi.Nivel
		var bolsas, minimo *int
		if err := linhas.Scan(&h.Id, &h.Nome, &h.Uf, &h.Cidade, &h.Latitude, &h.Longitude,
			&tipo, &nivel, &h.AtualizadoNaFonte, &h.ColetadoEm, &bolsas, &minimo); err != nil {
			return nil, err
		}
		i, existe := indice[h.Id]
		if !existe {
			h.Estoque = map[string]httpapi.Nivel{}
			h.Historico = map[string]httpapi.HistoricoTipo{}
			h.NivelGeral = nivel
			lista = append(lista, h)
			i = len(lista) - 1
			indice[h.Id] = i
		}
		lista[i].Estoque[tipo] = nivel
		if bolsas != nil && minimo != nil {
			if lista[i].Bolsas == nil {
				lista[i].Bolsas = &map[string]httpapi.Bolsas{}
			}
			(*lista[i].Bolsas)[tipo] = httpapi.Bolsas{Bolsas: *bolsas, Minimo: *minimo}
		}
		if gravidade[nivel] < gravidade[lista[i].NivelGeral] {
			lista[i].NivelGeral = nivel
		}
	}
	if err := linhas.Err(); err != nil {
		return nil, err
	}
	return lista, s.anexarHistorico(ctx, lista, indice)
}

func (s *Store) anexarHistorico(ctx context.Context, lista []httpapi.EstoqueHemocentro, indice map[string]int) error {
	linhas, err := s.pool.Query(ctx, consultaHistorico, s.agora().AddDate(0, 0, -30))
	if err != nil {
		return fmt.Errorf("consultar histórico: %w", err)
	}
	defer linhas.Close()
	for linhas.Next() {
		var id, tipo string
		var hist httpapi.HistoricoTipo
		if err := linhas.Scan(&id, &tipo, &hist.Dias, &hist.DiasCriticos); err != nil {
			return err
		}
		if i, ok := indice[id]; ok {
			lista[i].Historico[tipo] = hist
		}
	}
	return linhas.Err()
}

// A média nacional fica perto de 16 coletas por mil habitantes. Abaixo de 5, o estado
// quase certamente deixou de enviar dados à Anvisa (caso de MA, PI e DF em 2024).
const minimoPlausivel = 5

func taxaPorMil(coletas *int, populacao int) *float64 {
	if coletas == nil {
		return nil
	}
	porMil := math.Round(float64(*coletas)/float64(populacao)*10_000) / 10
	return &porMil
}

// Estatisticas devolve o ano mais recente de cada UF, com a série de todos os anos e os indicadores
// dos doadores daquele ano.
func (s *Store) Estatisticas(ctx context.Context) ([]httpapi.EstatisticaUF, error) {
	linhas, err := s.pool.Query(ctx, `SELECT uf, ano, coletas, populacao FROM estatisticas_uf ORDER BY ano`)
	if err != nil {
		return nil, fmt.Errorf("consultar estatísticas: %w", err)
	}
	todas, err := pgx.CollectRows(linhas, func(linha pgx.CollectableRow) (httpapi.EstatisticaUF, error) {
		var e httpapi.EstatisticaUF
		err := linha.Scan(&e.Uf, &e.Ano, &e.Coletas, &e.Populacao)
		e.PorMil = taxaPorMil(e.Coletas, e.Populacao)
		return e, err
	})
	if err != nil {
		return nil, err
	}
	ultimoAno := 0
	series := map[httpapi.UF][]httpapi.AnoColetas{}
	for _, e := range todas {
		ultimoAno = max(ultimoAno, e.Ano)
		series[e.Uf] = append(series[e.Uf], httpapi.AnoColetas{Ano: e.Ano, Coletas: e.Coletas, PorMil: e.PorMil})
	}
	indicadores, err := s.indicadores(ctx, ultimoAno)
	if err != nil {
		return nil, err
	}
	var lista []httpapi.EstatisticaUF
	for _, e := range todas {
		if e.Ano != ultimoAno {
			continue
		}
		e.Cobertura = httpapi.SemDado
		if e.PorMil != nil {
			e.Cobertura = httpapi.Completo
			if *e.PorMil < minimoPlausivel {
				e.Cobertura = httpapi.Incompleto
			}
		}
		serie := series[e.Uf]
		e.Serie = &serie
		if ind, ok := indicadores[string(e.Uf)]; ok {
			e.Indicadores = &ind
		}
		lista = append(lista, e)
	}
	sort.SliceStable(lista, func(a, b int) bool { return valor(lista[a].PorMil) > valor(lista[b].PorMil) })
	return lista, nil
}

func (s *Store) indicadores(ctx context.Context, ano int) (map[string]map[string]int, error) {
	linhas, err := s.pool.Query(ctx, `SELECT uf, indicador, valor FROM indicadores_uf WHERE ano = $1`, ano)
	if err != nil {
		return nil, fmt.Errorf("consultar indicadores: %w", err)
	}
	defer linhas.Close()
	porUF := map[string]map[string]int{}
	for linhas.Next() {
		var uf, indicador string
		var v int
		if err := linhas.Scan(&uf, &indicador, &v); err != nil {
			return nil, err
		}
		if porUF[uf] == nil {
			porUF[uf] = map[string]int{}
		}
		porUF[uf][indicador] = v
	}
	return porUF, linhas.Err()
}

func valor(p *float64) float64 {
	if p == nil {
		return -1
	}
	return *p
}

func (s *Store) RegistrarDoacao(ctx context.Context, d httpapi.Doacao) error {
	_, err := s.pool.Exec(ctx, `INSERT INTO doacoes_registradas (uf, tipo, data) VALUES ($1, $2, $3)`,
		d.Uf, d.Tipo, d.Data.Time)
	return err
}

func (s *Store) ContarDoacoes(ctx context.Context, mes string) (int, error) {
	var total int
	err := s.pool.QueryRow(ctx,
		`SELECT count(*) FROM doacoes_registradas WHERE to_char(data, 'YYYY-MM') = $1`, mes).Scan(&total)
	return total, err
}

// GravarColeta grava as leituras das fontes que funcionaram e marca a última coleta boa de cada uma.
// Tudo numa transação: ou entra a coleta inteira ou nada.
func (s *Store) GravarColeta(ctx context.Context, resultados []coleta.Resultado, coletadoEm time.Time) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		for _, r := range resultados {
			if r.Erro != nil {
				continue
			}
			for _, l := range r.Leituras {
				var bolsas, minimo *int
				if c, ok := r.Bolsas[l.Tipo]; ok {
					bolsas, minimo = &c.Bolsas, &c.Minimo
				}
				if _, err := tx.Exec(ctx, `INSERT INTO leituras_estoque (hemocentro_id, tipo, nivel, atualizado_na_fonte, coletado_em, bolsas, bolsas_minimo)
				  VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7)`, r.FonteID, l.Tipo, l.Nivel, r.AtualizadoNaFonte, coletadoEm, bolsas, minimo); err != nil {
					return fmt.Errorf("gravar leitura de %s: %w", r.FonteID, err)
				}
			}
			if _, err := tx.Exec(ctx, `UPDATE fontes SET ultima_coleta_ok = $2 WHERE id = $1`, r.FonteID, coletadoEm); err != nil {
				return err
			}
		}
		return nil
	})
}
