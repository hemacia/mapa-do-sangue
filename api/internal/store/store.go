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
	"github.com/hemacia/mapa-do-sangue/api/internal/estatisticas"
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
	parciais, err := s.parciais(ctx)
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
		if p, ok := parciais[e.Uf]; ok {
			e.Parcial = &p
		}
		lista = append(lista, e)
	}
	sort.SliceStable(lista, func(a, b int) bool { return valor(lista[a].PorMil) > valor(lista[b].PorMil) })
	return lista, nil
}

func (s *Store) parciais(ctx context.Context) (map[httpapi.UF]httpapi.ParcialUF, error) {
	linhas, err := s.pool.Query(ctx, `SELECT uf, ano, ate_mes, coletas, coletas_ano_anterior FROM parcial_uf`)
	if err != nil {
		return nil, fmt.Errorf("consultar parcial: %w", err)
	}
	defer linhas.Close()
	porUF := map[httpapi.UF]httpapi.ParcialUF{}
	for linhas.Next() {
		var uf httpapi.UF
		var p httpapi.ParcialUF
		if err := linhas.Scan(&uf, &p.Ano, &p.AteMes, &p.Coletas, &p.ColetasAnoAnterior); err != nil {
			return nil, err
		}
		porUF[uf] = p
	}
	return porUF, linhas.Err()
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

func (s *Store) PontosColeta(ctx context.Context, uf string) ([]httpapi.PontoColeta, error) {
	linhas, err := s.pool.Query(ctx, `
	  SELECT cnes, nome, uf, cidade, endereco, bairro, telefone, latitude, longitude, publico
	  FROM pontos_coleta WHERE uf = $1 ORDER BY publico DESC, cidade, nome`, uf)
	if err != nil {
		return nil, fmt.Errorf("consultar pontos de coleta: %w", err)
	}
	return pgx.CollectRows(linhas, func(linha pgx.CollectableRow) (httpapi.PontoColeta, error) {
		var p httpapi.PontoColeta
		err := linha.Scan(&p.Cnes, &p.Nome, &p.Uf, &p.Cidade, &p.Endereco, &p.Bairro, &p.Telefone, &p.Latitude, &p.Longitude, &p.Publico)
		return p, err
	})
}

func (s *Store) Alertas(ctx context.Context, uf string, desde time.Time) ([]httpapi.AlertaNoticiado, error) {
	linhas, err := s.pool.Query(ctx, `
	  SELECT uf, fonte, titulo, url, publicado_em FROM alertas_noticiados
	  WHERE uf = $1 AND publicado_em >= $2 ORDER BY publicado_em DESC LIMIT 3`, uf, desde)
	if err != nil {
		return nil, fmt.Errorf("consultar alertas: %w", err)
	}
	return pgx.CollectRows(linhas, func(linha pgx.CollectableRow) (httpapi.AlertaNoticiado, error) {
		var a httpapi.AlertaNoticiado
		err := linha.Scan(&a.Uf, &a.Fonte, &a.Titulo, &a.Url, &a.PublicadoEm)
		return a, err
	})
}

// GravarAlertas guarda as notícias novas; a mesma URL vista de novo só atualiza o título.
func (s *Store) GravarAlertas(ctx context.Context, noticias []coleta.Noticia, coletadoEm time.Time) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		for _, n := range noticias {
			if _, err := tx.Exec(ctx, `
			  INSERT INTO alertas_noticiados (url, uf, fonte, titulo, publicado_em, coletado_em)
			  VALUES ($1, $2, $3, $4, $5, $6)
			  ON CONFLICT (url) DO UPDATE SET titulo = EXCLUDED.titulo`,
				n.URL, n.UF, n.FonteID, n.Titulo, n.PublicadaEm, coletadoEm); err != nil {
				return fmt.Errorf("gravar alerta %s: %w", n.URL, err)
			}
		}
		return nil
	})
}

// GravarImportacao aplica a atualização mensal da Anvisa: anos fechados por cima do que existe e o
// comparativo do ano em andamento no lugar do anterior. Tudo ou nada.
func (s *Store) GravarImportacao(ctx context.Context, imp estatisticas.Importacao) error {
	return pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		for ano, porUF := range imp.Totais {
			for _, uf := range estatisticas.UFs {
				var coletas *int
				if ind, ok := porUF[uf]; ok {
					c := ind["coletas"]
					coletas = &c
				}
				if _, err := tx.Exec(ctx, `
				  INSERT INTO estatisticas_uf (uf, ano, coletas, populacao) VALUES ($1, $2, $3, $4)
				  ON CONFLICT (uf, ano) DO UPDATE SET coletas = EXCLUDED.coletas, populacao = EXCLUDED.populacao`,
					uf, ano, coletas, imp.Populacao[ano][uf]); err != nil {
					return fmt.Errorf("gravar estatística %s %d: %w", uf, ano, err)
				}
				for indicador, valor := range porUF[uf] {
					if indicador == "coletas" {
						continue
					}
					if _, err := tx.Exec(ctx, `
					  INSERT INTO indicadores_uf (uf, ano, indicador, valor) VALUES ($1, $2, $3, $4)
					  ON CONFLICT (uf, ano, indicador) DO UPDATE SET valor = EXCLUDED.valor`,
						uf, ano, indicador, valor); err != nil {
						return fmt.Errorf("gravar indicador %s %d: %w", uf, ano, err)
					}
				}
			}
		}
		if imp.AteMes == 0 {
			return nil
		}
		if _, err := tx.Exec(ctx, `DELETE FROM parcial_uf`); err != nil {
			return err
		}
		for uf, c := range imp.Comparativo {
			if c[0] == 0 || c[1] == 0 {
				continue
			}
			if _, err := tx.Exec(ctx, `
			  INSERT INTO parcial_uf (uf, ano, ate_mes, coletas, coletas_ano_anterior) VALUES ($1, $2, $3, $4, $5)`,
				uf, imp.AnoParcial, imp.AteMes, c[1], c[0]); err != nil {
				return fmt.Errorf("gravar parcial %s: %w", uf, err)
			}
		}
		return nil
	})
}

func (s *Store) RegistrarDoacao(ctx context.Context, d httpapi.Doacao) error {
	_, err := s.pool.Exec(ctx, `INSERT INTO doacoes_registradas (uf, tipo, data) VALUES ($1, $2, $3)`,
		d.Uf, d.Tipo, d.Data.Time)
	return err
}

func (s *Store) ContarDoacoes(ctx context.Context, dia time.Time) (mes, hoje int, err error) {
	err = s.pool.QueryRow(ctx, `
	  SELECT count(*), count(*) FILTER (WHERE data = $1::date)
	  FROM doacoes_registradas WHERE date_trunc('month', data) = date_trunc('month', $1::date)`,
		dia.Format(time.DateOnly)).Scan(&mes, &hoje)
	return mes, hoje, err
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
