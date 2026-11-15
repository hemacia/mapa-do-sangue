-- +goose Up
-- Onde doar: unidades de hemoterapia do CNES que podem receber doador (sem agência transfusional nem laboratório).
CREATE TABLE pontos_coleta (
  cnes       integer PRIMARY KEY,
  nome       text NOT NULL,
  uf         char(2) NOT NULL CHECK (uf = upper(uf)),
  cidade     text,
  endereco   text,
  bairro     text,
  telefone   text,
  latitude   double precision NOT NULL,
  longitude  double precision NOT NULL,
  publico    boolean NOT NULL
);

CREATE INDEX idx_pontos_coleta_uf ON pontos_coleta (uf);

-- +goose Down
DROP TABLE pontos_coleta;
