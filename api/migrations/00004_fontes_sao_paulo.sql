-- +goose Up
-- Pró-Sangue (capital) e a rede do Hemocentro de Ribeirão Preto: as primeiras fontes com número de bolsas.
-- shortcut: coordenadas aproximadas da sede; trocar pelas do CNES quando importar os pontos de coleta.

ALTER TABLE leituras_estoque ADD COLUMN bolsas_minimo integer CHECK (bolsas_minimo >= 0);

INSERT INTO hemocentros (id, nome, uf, cidade, latitude, longitude) VALUES
  ('prosangue', 'Pró-Sangue', 'SP', 'São Paulo', -23.5558, -46.6696),
  ('rp-ribeirao', 'Hemocentro de Ribeirão Preto', 'SP', 'Ribeirão Preto', -21.1652, -47.8580),
  ('rp-aracatuba', 'Hemocentro RP em Araçatuba', 'SP', 'Araçatuba', -21.2089, -50.4328),
  ('rp-fernandopolis', 'Hemocentro RP em Fernandópolis', 'SP', 'Fernandópolis', -20.2839, -50.2464),
  ('rp-prudente', 'Hemocentro RP em Presidente Prudente', 'SP', 'Presidente Prudente', -22.1256, -51.3889),
  ('rp-taubate', 'Hemocentro RP em Taubaté', 'SP', 'Taubaté', -23.0264, -45.5553);

INSERT INTO fontes (id, hemocentro_id, url, formato) VALUES
  ('prosangue', 'prosangue', 'https://prosangue.sp.gov.br/reqestoque/posicao_estoque.php', 'html'),
  ('rp-ribeirao', 'rp-ribeirao', 'https://www.hemocentro.fmrp.usp.br/canal-do-doador/estoque-de-sangue/', 'html'),
  ('rp-aracatuba', 'rp-aracatuba', 'https://www.hemocentro.fmrp.usp.br/canal-do-doador/estoque-de-sangue/', 'html'),
  ('rp-fernandopolis', 'rp-fernandopolis', 'https://www.hemocentro.fmrp.usp.br/canal-do-doador/estoque-de-sangue/', 'html'),
  ('rp-prudente', 'rp-prudente', 'https://www.hemocentro.fmrp.usp.br/canal-do-doador/estoque-de-sangue/', 'html'),
  ('rp-taubate', 'rp-taubate', 'https://www.hemocentro.fmrp.usp.br/canal-do-doador/estoque-de-sangue/', 'html');

-- +goose Down
DELETE FROM leituras_estoque WHERE hemocentro_id IN ('prosangue', 'rp-ribeirao', 'rp-aracatuba', 'rp-fernandopolis', 'rp-prudente', 'rp-taubate');
DELETE FROM fontes WHERE id IN ('prosangue', 'rp-ribeirao', 'rp-aracatuba', 'rp-fernandopolis', 'rp-prudente', 'rp-taubate');
DELETE FROM hemocentros WHERE id IN ('prosangue', 'rp-ribeirao', 'rp-aracatuba', 'rp-fernandopolis', 'rp-prudente', 'rp-taubate');
ALTER TABLE leituras_estoque DROP COLUMN bolsas_minimo;
