-- +goose Up
-- MT-Hemocentro: página pública do sistema de agendamento, com o nível no nome da imagem.
INSERT INTO hemocentros (id, nome, uf, cidade, latitude, longitude) VALUES
  ('mthemocentro', 'MT-Hemocentro', 'MT', 'Cuiabá', -15.5989, -56.0949);

INSERT INTO fontes (id, hemocentro_id, url, formato) VALUES
  ('mthemocentro', 'mthemocentro', 'https://mthemocentro.saude.mt.gov.br/estoque.consulta.publico.php', 'html');

-- +goose Down
DELETE FROM leituras_estoque WHERE hemocentro_id = 'mthemocentro';
DELETE FROM fontes WHERE id = 'mthemocentro';
DELETE FROM hemocentros WHERE id = 'mthemocentro';
