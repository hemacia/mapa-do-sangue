-- +goose Up
-- Hemosul: painel Qlik Sense com bolsas de hemácias e estoque estratégico por tipo.
INSERT INTO hemocentros (id, nome, uf, cidade, latitude, longitude) VALUES
  ('hemosul', 'Hemosul', 'MS', 'Campo Grande', -20.4615, -54.6266);

INSERT INTO fontes (id, hemocentro_id, url, formato) VALUES
  ('hemosul', 'hemosul', 'https://paineispublicos.saude.ms.gov.br/extensions/EstoqueHemosul/EstoqueHemosul.html', 'qlik');

-- +goose Down
DELETE FROM leituras_estoque WHERE hemocentro_id = 'hemosul';
DELETE FROM fontes WHERE id = 'hemosul';
DELETE FROM hemocentros WHERE id = 'hemosul';
