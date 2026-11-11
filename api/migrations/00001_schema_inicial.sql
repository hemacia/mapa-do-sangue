-- +goose Up
-- Os CHECKs repetem o domínio para que dado inválido não entre mesmo se um coletor errar.
CREATE TYPE tipo_sanguineo AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
-- Ordem do pior para o melhor: permite min(nivel) para achar o mais grave.
CREATE TYPE nivel_estoque AS ENUM ('critico', 'alerta', 'estavel', 'adequado');

CREATE TABLE hemocentros (
  id         text PRIMARY KEY,
  nome       text NOT NULL,
  uf         char(2) NOT NULL CHECK (uf = upper(uf)),
  cidade     text NOT NULL,
  latitude   double precision,
  longitude  double precision,
  cnes       text
);

CREATE TABLE fontes (
  id                text PRIMARY KEY,
  hemocentro_id     text NOT NULL REFERENCES hemocentros (id),
  url               text NOT NULL,
  formato           text NOT NULL CHECK (formato IN ('html', 'json', 'csv', 'qlik', 'imagem')),
  ultima_coleta_ok  timestamptz
);

CREATE TABLE leituras_estoque (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hemocentro_id        text NOT NULL REFERENCES hemocentros (id),
  tipo                 tipo_sanguineo NOT NULL,
  nivel                nivel_estoque NOT NULL,
  bolsas               integer CHECK (bolsas >= 0),
  atualizado_na_fonte  text,
  coletado_em          timestamptz NOT NULL,
  UNIQUE (hemocentro_id, tipo, coletado_em)
);

CREATE INDEX idx_leituras_hemocentro_data ON leituras_estoque (hemocentro_id, coletado_em);

CREATE TABLE estatisticas_uf (
  uf         char(2) NOT NULL,
  ano        integer NOT NULL,
  coletas    integer CHECK (coletas >= 0),
  populacao  integer NOT NULL CHECK (populacao > 0),
  PRIMARY KEY (uf, ano)
);

-- Botão "Eu doei hoje!": sem nome, e-mail ou qualquer dado pessoal (LGPD).
CREATE TABLE doacoes_registradas (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uf         char(2) NOT NULL CHECK (uf = upper(uf)),
  tipo       tipo_sanguineo,
  data       date NOT NULL,
  criado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_doacoes_data ON doacoes_registradas (data);

-- +goose Down
DROP TABLE doacoes_registradas, estatisticas_uf, leituras_estoque, fontes, hemocentros;
DROP TYPE nivel_estoque, tipo_sanguineo;
