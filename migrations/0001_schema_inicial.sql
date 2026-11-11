-- Schema do Cloudflare D1 (SQLite). Os CHECKs repetem o domínio de src/domain
-- para que dado inválido não entre no banco mesmo se um coletor errar.

CREATE TABLE hemocentros (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  uf         TEXT NOT NULL CHECK (length(uf) = 2 AND uf = upper(uf)),
  cidade     TEXT NOT NULL,
  latitude   REAL,
  longitude  REAL,
  cnes       TEXT
);

CREATE TABLE fontes (
  id                 TEXT PRIMARY KEY,
  hemocentro_id      TEXT NOT NULL REFERENCES hemocentros (id),
  url                TEXT NOT NULL,
  formato            TEXT NOT NULL CHECK (formato IN ('html', 'json', 'csv', 'qlik', 'imagem')),
  ultima_coleta_ok   TEXT
);

CREATE TABLE leituras_estoque (
  id             INTEGER PRIMARY KEY,
  hemocentro_id  TEXT NOT NULL REFERENCES hemocentros (id),
  tipo           TEXT NOT NULL CHECK (tipo IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  nivel          TEXT NOT NULL CHECK (nivel IN ('critico', 'alerta', 'estavel', 'adequado')),
  bolsas         INTEGER CHECK (bolsas >= 0),
  atualizado_na_fonte  TEXT,
  coletado_em    TEXT NOT NULL,
  UNIQUE (hemocentro_id, tipo, coletado_em)
);

CREATE INDEX idx_leituras_hemocentro_data ON leituras_estoque (hemocentro_id, coletado_em);

CREATE TABLE estatisticas_uf (
  uf         TEXT NOT NULL CHECK (length(uf) = 2),
  ano        INTEGER NOT NULL,
  coletas    INTEGER CHECK (coletas >= 0),
  populacao  INTEGER CHECK (populacao > 0),
  PRIMARY KEY (uf, ano)
);

-- Botão "Eu doei hoje!": sem nome, e-mail ou qualquer dado pessoal (LGPD).
CREATE TABLE doacoes_registradas (
  id         INTEGER PRIMARY KEY,
  uf         TEXT NOT NULL CHECK (length(uf) = 2 AND uf = upper(uf)),
  tipo       TEXT CHECK (tipo IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  data       TEXT NOT NULL,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);
