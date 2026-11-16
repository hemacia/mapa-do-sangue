-- +goose Up
-- Coletas de janeiro a março de 2026 e do mesmo período de 2025 (Anvisa, Hemoprod, envios mensais).
-- Gerado por api/cmd/estatisticas. SP, RJ e quem manda só o consolidado anual ficam de fora.
DELETE FROM parcial_uf;
INSERT INTO parcial_uf (uf, ano, ate_mes, coletas, coletas_ano_anterior) VALUES
  ('AC', 2026, 3, 62, 114),
  ('AL', 2026, 3, 5918, 6403),
  ('BA', 2026, 3, 15621, 14463),
  ('DF', 2026, 3, 3089, 2378),
  ('ES', 2026, 3, 1595, 1565),
  ('GO', 2026, 3, 6558, 6738),
  ('MG', 2026, 3, 1973, 1865),
  ('MT', 2026, 3, 7883, 7766),
  ('PB', 2026, 3, 6467, 6900),
  ('PE', 2026, 3, 28892, 27621),
  ('PR', 2026, 3, 31544, 32055),
  ('RR', 2026, 3, 4059, 3241),
  ('SC', 2026, 3, 33688, 33556),
  ('SE', 2026, 3, 12622, 11790),
  ('TO', 2026, 3, 3299, 3416);

-- +goose Down
DELETE FROM parcial_uf;
