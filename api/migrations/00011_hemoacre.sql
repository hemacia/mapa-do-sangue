-- +goose Up
-- Hemoacre: o estoque aparece na home do portal do governo do Acre (HTML, sem data).
INSERT INTO hemocentros (id, nome, uf, cidade, latitude, longitude) VALUES
  ('hemoacre', 'Hemoacre', 'AC', 'Rio Branco', -9.9754, -67.8249);

INSERT INTO fontes (id, hemocentro_id, url, formato) VALUES
  ('hemoacre', 'hemoacre', 'https://www.ac.gov.br/', 'html');

-- +goose Down
DELETE FROM leituras_estoque WHERE hemocentro_id = 'hemoacre';
DELETE FROM fontes WHERE id = 'hemoacre';
DELETE FROM hemocentros WHERE id = 'hemoacre';
