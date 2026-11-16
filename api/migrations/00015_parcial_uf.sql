-- +goose Up
-- Ano em andamento: a Anvisa publica os meses aos poucos. Guarda as coletas até o último mês
-- publicado e as do mesmo período do ano anterior, para comparar sem misturar com o ano fechado.
CREATE TABLE parcial_uf (
  uf                    char(2) NOT NULL CHECK (uf = upper(uf)),
  ano                   integer NOT NULL,
  ate_mes               smallint NOT NULL CHECK (ate_mes BETWEEN 1 AND 12),
  coletas               integer NOT NULL CHECK (coletas >= 0),
  coletas_ano_anterior  integer NOT NULL CHECK (coletas_ano_anterior > 0),
  PRIMARY KEY (uf, ano)
);

-- +goose Down
DROP TABLE parcial_uf;
