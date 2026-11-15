-- +goose Up
-- A cidade já aparece ao lado do nome; "Hemocentro RP em Araçatuba, Araçatuba" repetia.
UPDATE hemocentros SET nome = 'Hemocentro RP' WHERE id LIKE 'rp-%';

-- +goose Down
UPDATE hemocentros SET nome = 'Hemocentro de Ribeirão Preto' WHERE id = 'rp-ribeirao';
UPDATE hemocentros SET nome = 'Hemocentro RP em ' || cidade WHERE id LIKE 'rp-%' AND id <> 'rp-ribeirao';
