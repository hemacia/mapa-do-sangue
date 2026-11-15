-- +goose Up
-- Fundação Hemocentro de Brasília: o estoque sai de uma imagem diária, lida pela cor das gotas.
INSERT INTO hemocentros (id, nome, uf, cidade, latitude, longitude) VALUES
  ('fhb', 'Fundação Hemocentro de Brasília', 'DF', 'Brasília', -15.7801, -47.8925);

INSERT INTO fontes (id, hemocentro_id, url, formato) VALUES
  ('fhb', 'fhb', 'https://www.fhb.df.gov.br/estoque-de-sangue', 'imagem');

-- +goose Down
DELETE FROM leituras_estoque WHERE hemocentro_id = 'fhb';
DELETE FROM fontes WHERE id = 'fhb';
DELETE FROM hemocentros WHERE id = 'fhb';
