-- Hemocentros e fontes da Fase 1 (ver docs/pesquisa).
-- shortcut: coordenadas aproximadas da sede; trocar pelas do CNES quando importar os pontos de coleta.

INSERT INTO hemocentros (id, nome, uf, cidade, latitude, longitude) VALUES
  ('hemoes', 'HEMOES', 'ES', 'Vitória', -20.3155, -40.3128),
  ('hemopi', 'Hemopi', 'PI', 'Teresina', -5.0892, -42.8016),
  ('hemominas', 'Hemominas', 'MG', 'Belo Horizonte', -19.9245, -43.9352),
  ('unicamp', 'Hemocentro Unicamp', 'SP', 'Campinas', -22.8305, -47.0634),
  ('hemosc', 'Hemosc', 'SC', 'Florianópolis', -27.5954, -48.5480),
  ('hemoba', 'Hemoba', 'BA', 'Salvador', -12.9777, -38.5016);

INSERT INTO fontes (id, hemocentro_id, url, formato) VALUES
  ('hemoes', 'hemoes', 'https://dados.es.gov.br/dataset/estoque-de-sangue-hemoes', 'json'),
  ('hemopi', 'hemopi', 'https://www.hemopi.pi.gov.br/wp-json/wp/v2/posicao-estoque', 'json'),
  ('hemominas', 'hemominas', 'https://www.hemominas.mg.gov.br/', 'html'),
  ('unicamp', 'unicamp', 'https://www.hemocentro.unicamp.br/', 'html'),
  ('hemosc', 'hemosc', 'https://www.hemosc.org.br/', 'html'),
  ('hemoba', 'hemoba', 'https://www.ba.gov.br/hemoba/', 'html');
