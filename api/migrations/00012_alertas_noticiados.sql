-- +goose Up
-- Notícias de estoque baixo dos sites oficiais. Não são leitura do estoque: o site mostra como "alerta noticiado".
CREATE TABLE alertas_noticiados (
  url           text PRIMARY KEY CHECK (url LIKE 'https://%'),
  uf            char(2) NOT NULL CHECK (uf = upper(uf)),
  fonte         text NOT NULL,
  titulo        text NOT NULL,
  publicado_em  timestamptz NOT NULL,
  coletado_em   timestamptz NOT NULL
);

CREATE INDEX idx_alertas_uf_data ON alertas_noticiados (uf, publicado_em DESC);

-- +goose Down
DROP TABLE alertas_noticiados;
