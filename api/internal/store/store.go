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
         l.tipo::text, l.nivel::text, l.atualizado_na_fonte, l.coletado_em
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
		if err := linhas.Scan(&h.Id, &h.Nome, &h.Uf, &h.Cidade, &h.Latitude, &h.Longitude,
			&tipo, &nivel, &h.AtualizadoNaFonte, &h.ColetadoEm); err != nil {
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

func (s *Store) Estatisticas(ctx context.Context) ([]httpapi.EstatisticaUF, error) {
	linhas, err := s.pool.Query(ctx, `
	  SELECT uf, ano, coletas, populacao FROM estatisticas_uf
	  WHERE ano = (SELECT max(ano) FROM estatisticas_uf)`)
	if err != nil {
		return nil, fmt.Errorf("consultar estatísticas: %w", err)
	}
	lista, err := pgx.CollectRows(linhas, func(linha pgx.CollectableRow) (httpapi.EstatisticaUF, error) {
		var e httpapi.EstatisticaUF
		err := linha.Scan(&e.Uf, &e.Ano, &e.Coletas, &e.Populacao)
		e.Cobertura = httpapi.SemDado
		if e.Coletas != nil {
			porMil := math.Round(float64(*e.Coletas)/float64(e.Populacao)*10_000) / 10
			e.PorMil = &porMil
			e.Cobertura = httpapi.Completo
			if porMil < minimoPlausivel {
				e.Cobertura = httpapi.Incompleto
			}
		}
		return e, err
	})
	if err != nil {
		return nil, err
	}
	sort.SliceStable(lista, func(a, b int) bool { return valor(lista[a].PorMil) > valor(lista[b].PorMil) })
	return lista, nil
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
