-- +goose Up
-- Perfil dos doadores por estado (Anvisa, Hemoprod): primeira vez, repetição, gênero, idade, tipos sanguíneos.
-- Um indicador por linha para não criar uma coluna a cada pergunta nova do formulário.
CREATE TABLE indicadores_uf (
  uf         char(2) NOT NULL CHECK (uf = upper(uf)),
  ano        integer NOT NULL,
  indicador  text NOT NULL,
  valor      integer NOT NULL CHECK (valor >= 0),
  PRIMARY KEY (uf, ano, indicador)
);

-- +goose Down
DROP TABLE indicadores_uf;
