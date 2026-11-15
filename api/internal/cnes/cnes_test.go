package cnes

import (
	"strings"
	"testing"
)

func ptr[T any](v T) *T { return &v }

func estabelecimento(cnes int, nome string) Estabelecimento {
	return Estabelecimento{
		CNES: cnes, NomeFantasia: nome, Endereco: "RUA DUARTE DA COSTA", Numero: "109", Bairro: "CAMINHO DE AREIA",
		Telefone: ptr("(71) 3312-4301"), Latitude: ptr(-12.99), Longitude: ptr(-38.49), Municipio: 292740,
		NaturezaJuridica: ptr("1147"),
	}
}

var municipios = map[int]string{292740: "Salvador"}
var ufs = map[int]string{29: "BA"}

func TestSelecionarTiraAgenciaTransfusionalLaboratorioEDesativada(t *testing.T) {
	desativada := estabelecimento(4, "HEMANA")
	desativada.MotivoDesabilitar = ptr("04")
	semCoordenada := estabelecimento(5, "HEMOCENTRO X")
	semCoordenada.Latitude = nil

	pontos := Selecionar([]Estabelecimento{
		estabelecimento(1, "FUNDACAO HEMOBA"),
		estabelecimento(2, "AGENCIA TRANSFUNSIONAL DE DIAMANTINO"),
		estabelecimento(3, "LABORATÓRIO KL"),
		desativada, semCoordenada,
		estabelecimento(6, "AT HOSP SAO PAULO RP SP"),
		estabelecimento(7, "AG HOSPITAL MARCOS MORAES"),
	}, municipios, ufs)

	if len(pontos) != 1 || pontos[0].CNES != 1 {
		t.Fatalf("pontos = %+v", pontos)
	}
	p := pontos[0]
	if p.Nome != "Fundacao Hemoba" || p.UF != "BA" || p.Cidade != "Salvador" || p.Endereco != "Rua Duarte da Costa, 109" || !p.Publico {
		t.Errorf("ponto = %+v", p)
	}
}

func TestSelecionarSeparaPrivadoPelaNaturezaJuridica(t *testing.T) {
	privado := estabelecimento(1, "COLSAN P S CENTRAL")
	privado.NaturezaJuridica = ptr("3999")

	if Selecionar([]Estabelecimento{privado}, municipios, ufs)[0].Publico {
		t.Error("natureza 3999 (associação) não é pública")
	}
}

func TestNomeProprio(t *testing.T) {
	casos := map[string]string{
		"HEMOCENTRO REGIONAL DE ROLIM DE MOURA": "Hemocentro Regional de Rolim de Moura",
		"HEMOCENTRO DA UFMG":                    "Hemocentro da UFMG",
		"DE PAULA HEMOTERAPIA":                  "De Paula Hemoterapia",
		"  MT   HEMOCENTRO ":                    "MT Hemocentro",
	}
	for entrada, quero := range casos {
		if got := nomeProprio(entrada); got != quero {
			t.Errorf("%q = %q, quero %q", entrada, got, quero)
		}
	}
}

func TestGerarMigrationEscapaAspasESemTelefoneViraNull(t *testing.T) {
	sql := GerarMigration([]Ponto{{CNES: 9, Nome: "Hemocentro D'Oeste", UF: "RO", Cidade: "Ji-Paraná", Latitude: -10.8, Longitude: -61.9}}, "2026-11-15")

	for _, trecho := range []string{"(9, 'Hemocentro D''Oeste', 'RO', 'Ji-Paraná', NULL, NULL, NULL, -10.8, -61.9, false);", "DELETE FROM pontos_coleta;", "-- +goose Down"} {
		if !strings.Contains(sql, trecho) {
			t.Errorf("faltou %q em:\n%s", trecho, sql)
		}
	}
}

func TestSelecionarTiraZerosDoNumero(t *testing.T) {
	e := estabelecimento(1, "SERUM")
	e.Numero = "00027"

	if got := Selecionar([]Estabelecimento{e}, municipios, ufs)[0].Endereco; got != "Rua Duarte da Costa, 27" {
		t.Errorf("endereço = %q", got)
	}
}
