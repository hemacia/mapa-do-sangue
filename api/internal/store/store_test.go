package store

import (
	"context"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	openapi_types "github.com/oapi-codegen/runtime/types"

	"github.com/hemacia/mapa-do-sangue/api/internal/coleta"
	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
)

var agoraFixo = time.Date(2026, 11, 10, 15, 0, 0, 0, time.UTC)

// bancoDeTeste cria um schema só para o teste, aplica as migrations e apaga no fim.
// No CI a variável é obrigatória; na máquina, sem ela o teste é pulado.
func bancoDeTeste(t *testing.T) *Store {
	t.Helper()
	url := os.Getenv("DATABASE_URL_TEST")
	if url == "" {
		if os.Getenv("CI") != "" {
			t.Fatal("DATABASE_URL_TEST não definida no CI")
		}
		t.Skip("DATABASE_URL_TEST não definida (rode make db-test)")
	}
	ctx := context.Background()
	schema := fmt.Sprintf("teste_%d", time.Now().UnixNano())

	admin, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(admin.Close)
	if _, err := admin.Exec(ctx, "CREATE SCHEMA "+schema); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = admin.Exec(context.Background(), "DROP SCHEMA "+schema+" CASCADE") })

	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		t.Fatal(err)
	}
	cfg.ConnConfig.RuntimeParams["search_path"] = schema
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	if err := Migrar(ctx, pool); err != nil {
		t.Fatalf("migrations: %v", err)
	}
	return Novo(pool, func() time.Time { return agoraFixo })
}

func executar(t *testing.T, s *Store, sql string, args ...any) {
	t.Helper()
	if _, err := s.pool.Exec(context.Background(), sql, args...); err != nil {
		t.Fatalf("%s: %v", sql, err)
	}
}

func inserirLeitura(t *testing.T, s *Store, hemocentro, tipo, nivel string, em time.Time) {
	t.Helper()
	executar(t, s, `INSERT INTO leituras_estoque (hemocentro_id, tipo, nivel, coletado_em) VALUES ($1, $2, $3, $4)`,
		hemocentro, tipo, nivel, em)
}

func TestPingRespondeComOBancoNoAr(t *testing.T) {
	s := bancoDeTeste(t)

	err := s.Ping(context.Background())
	if err != nil {
		t.Fatal(err)
	}
}

func TestMigrarDuasVezesNaoFalha(t *testing.T) {
	s := bancoDeTeste(t)

	err := Migrar(context.Background(), s.pool)
	if err != nil {
		t.Fatal(err)
	}
}

func TestBancoRecusaNivelForaDaEscala(t *testing.T) {
	s := bancoDeTeste(t)

	_, err := s.pool.Exec(context.Background(),
		`INSERT INTO leituras_estoque (hemocentro_id, tipo, nivel, coletado_em) VALUES ('hemominas', 'O+', 'baixo', now())`)

	if err == nil {
		t.Fatal("o banco aceitou um nível que não existe")
	}
}

func TestBancoRecusaLeituraRepetidaNaMesmaColeta(t *testing.T) {
	s := bancoDeTeste(t)
	inserirLeitura(t, s, "hemominas", "O+", "critico", agoraFixo)

	_, err := s.pool.Exec(context.Background(),
		`INSERT INTO leituras_estoque (hemocentro_id, tipo, nivel, coletado_em) VALUES ('hemominas', 'O+', 'alerta', $1)`, agoraFixo)

	if err == nil {
		t.Fatal("o banco aceitou duas leituras do mesmo tipo na mesma coleta")
	}
}

func TestEstoqueAtualUsaSoAUltimaColetaDeCadaHemocentro(t *testing.T) {
	s := bancoDeTeste(t)
	ontem := agoraFixo.Add(-24 * time.Hour)
	inserirLeitura(t, s, "hemominas", "O+", "adequado", ontem)
	inserirLeitura(t, s, "hemominas", "O+", "critico", agoraFixo)
	inserirLeitura(t, s, "hemominas", "A+", "estavel", agoraFixo)

	estoque, err := s.EstoqueAtual(context.Background(), "")
	if err != nil {
		t.Fatal(err)
	}
	if len(estoque) != 1 {
		t.Fatalf("hemocentros = %d, quero 1", len(estoque))
	}
	h := estoque[0]
	if h.Estoque["O+"] != httpapi.Critico || h.Estoque["A+"] != httpapi.Estavel || len(h.Estoque) != 2 {
		t.Errorf("estoque = %v", h.Estoque)
	}
	if h.NivelGeral != httpapi.Critico {
		t.Errorf("nível geral = %s, quero critico (o mais grave)", h.NivelGeral)
	}
	if h.Uf != "MG" || h.Cidade != "Belo Horizonte" {
		t.Errorf("hemocentro = %+v", h)
	}
}

func TestEstoqueAtualFiltraPorUF(t *testing.T) {
	s := bancoDeTeste(t)
	inserirLeitura(t, s, "hemominas", "O+", "critico", agoraFixo)
	inserirLeitura(t, s, "hemoba", "O+", "estavel", agoraFixo)

	estoque, err := s.EstoqueAtual(context.Background(), "BA")
	if err != nil {
		t.Fatal(err)
	}
	if len(estoque) != 1 || estoque[0].Id != "hemoba" {
		t.Errorf("estoque = %+v", estoque)
	}
}

func TestHistoricoContaDiasDistintosNoHorarioDeBrasilia(t *testing.T) {
	s := bancoDeTeste(t)
	dia := func(d, h int) time.Time { return time.Date(2026, 11, d, h, 0, 0, 0, time.UTC) }
	// 9/11 às 12h e 18h UTC: mesmo dia, duas coletas. 10/11 às 02h UTC ainda é 9/11 em Brasília.
	inserirLeitura(t, s, "hemominas", "O-", "critico", dia(9, 12))
	inserirLeitura(t, s, "hemominas", "O-", "critico", dia(9, 18))
	inserirLeitura(t, s, "hemominas", "O-", "alerta", dia(10, 2))
	inserirLeitura(t, s, "hemominas", "O-", "estavel", dia(10, 12))
	inserirLeitura(t, s, "hemominas", "O-", "critico", dia(1, 12).AddDate(0, -2, 0)) // fora dos 30 dias

	estoque, err := s.EstoqueAtual(context.Background(), "")
	if err != nil {
		t.Fatal(err)
	}
	hist := estoque[0].Historico["O-"]
	if hist.Dias != 2 || hist.DiasCriticos != 1 {
		t.Errorf("histórico = %+v, quero 2 dias e 1 crítico", hist)
	}
}

func TestEstatisticasCalculaTaxaECoberturaOrdenadas(t *testing.T) {
	s := bancoDeTeste(t)
	executar(t, s, `DELETE FROM estatisticas_uf`)
	executar(t, s, `INSERT INTO estatisticas_uf (uf, ano, coletas, populacao) VALUES
	  ('MG', 2025, 300000, 20000000), ('DF', 2025, 5000, 3000000), ('RO', 2025, NULL, 1800000),
	  ('SP', 2024, 1, 1)`)

	estatisticas, err := s.Estatisticas(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(estatisticas) != 3 {
		t.Fatalf("linhas = %d, quero 3 (só o ano mais recente)", len(estatisticas))
	}
	mg, df, ro := estatisticas[0], estatisticas[1], estatisticas[2]
	if mg.Uf != "MG" || *mg.PorMil != 15 || mg.Cobertura != httpapi.Completo {
		t.Errorf("MG = %+v", mg)
	}
	if df.Uf != "DF" || *df.PorMil != 1.7 || df.Cobertura != httpapi.Incompleto {
		t.Errorf("DF = %+v", df)
	}
	if ro.Uf != "RO" || ro.PorMil != nil || ro.Cobertura != httpapi.SemDado {
		t.Errorf("RO = %+v", ro)
	}
}

func TestMigrationCarregaAs27UFsDe2025ComSerieEIndicadores(t *testing.T) {
	s := bancoDeTeste(t)

	estatisticas, err := s.Estatisticas(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(estatisticas) != 27 {
		t.Errorf("UFs = %d, quero 27", len(estatisticas))
	}
	for _, e := range estatisticas {
		if e.Uf == "RJ" && (e.Ano != 2025 || e.Coletas == nil || *e.Coletas < 200000 || len(*e.Serie) != 2) {
			t.Errorf("RJ = %+v (a rede do RJ vem em linhas agregadas e não pode zerar)", e)
		}
		if e.Uf == "SP" && (e.Indicadores == nil || (*e.Indicadores)["tipo_O-"] == 0) {
			t.Errorf("SP sem indicadores: %+v", e.Indicadores)
		}
	}
}

func TestEstatisticasMontaASerieEOsIndicadoresDoUltimoAno(t *testing.T) {
	s := bancoDeTeste(t)
	executar(t, s, `DELETE FROM indicadores_uf`)
	executar(t, s, `DELETE FROM estatisticas_uf`)
	executar(t, s, `INSERT INTO estatisticas_uf (uf, ano, coletas, populacao) VALUES
	  ('MG', 2024, 280000, 20000000), ('MG', 2025, 300000, 20000000)`)
	executar(t, s, `INSERT INTO indicadores_uf (uf, ano, indicador, valor) VALUES
	  ('MG', 2025, 'primeira_vez', 90000), ('MG', 2024, 'primeira_vez', 1)`)

	estatisticas, err := s.Estatisticas(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	mg := estatisticas[0]
	if serie := *mg.Serie; len(serie) != 2 || serie[0].Ano != 2024 || *serie[0].PorMil != 14 || *serie[1].PorMil != 15 {
		t.Errorf("série = %+v", serie)
	}
	if mg.Indicadores == nil || (*mg.Indicadores)["primeira_vez"] != 90000 {
		t.Errorf("indicadores = %v, quero os de 2025", mg.Indicadores)
	}
}

func TestRegistrarEContarDoacoesDoMes(t *testing.T) {
	s := bancoDeTeste(t)
	ctx := context.Background()
	tipo := httpapi.O1
	data := func(texto string) openapi_types.Date {
		d, _ := time.Parse(time.DateOnly, texto)
		return openapi_types.Date{Time: d}
	}

	for _, d := range []httpapi.Doacao{
		{Uf: "MG", Tipo: &tipo, Data: data("2026-11-01")},
		{Uf: "SP", Tipo: nil, Data: data("2026-11-30")},
		{Uf: "SP", Tipo: nil, Data: data("2026-10-31")},
	} {
		if err := s.RegistrarDoacao(ctx, d); err != nil {
			t.Fatal(err)
		}
	}
	total, hoje, err := s.ContarDoacoes(ctx, time.Date(2026, 11, 30, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatal(err)
	}
	if total != 2 || hoje != 1 {
		t.Errorf("total = %d, hoje = %d, quero 2 e 1", total, hoje)
	}
}

func TestGravarColetaGravaSoAsFontesQueFuncionaram(t *testing.T) {
	s := bancoDeTeste(t)
	ctx := context.Background()
	resultados := []coleta.Resultado{
		{FonteID: "hemoba", Leituras: []coleta.Leitura{{Tipo: "O-", Nivel: httpapi.Critico}, {Tipo: "A+", Nivel: httpapi.Estavel}}},
		{FonteID: "hemominas", Leituras: []coleta.Leitura{{Tipo: "O+", Nivel: httpapi.Alerta}}, AtualizadoNaFonte: "2026-11-10T12:35"},
		{FonteID: "hemosc", Erro: errors.New("HTTP 500")},
	}

	if err := s.GravarColeta(ctx, resultados, agoraFixo); err != nil {
		t.Fatal(err)
	}

	estoque, err := s.EstoqueAtual(ctx, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(estoque) != 2 || estoque[0].Id != "hemoba" || len(estoque[0].Estoque) != 2 {
		t.Fatalf("estoque = %+v", estoque)
	}
	if estoque[1].AtualizadoNaFonte == nil || *estoque[1].AtualizadoNaFonte != "2026-11-10T12:35" || estoque[0].AtualizadoNaFonte != nil {
		t.Errorf("atualizado na fonte: hemoba %v, hemominas %v", estoque[0].AtualizadoNaFonte, estoque[1].AtualizadoNaFonte)
	}
	var marcadas int
	if err := s.pool.QueryRow(ctx, `SELECT count(*) FROM fontes WHERE ultima_coleta_ok = $1`, agoraFixo).Scan(&marcadas); err != nil {
		t.Fatal(err)
	}
	if marcadas != 2 {
		t.Errorf("fontes marcadas = %d, quero 2 (hemosc falhou)", marcadas)
	}
}

func TestGravarColetaGuardaAsBolsasSoDasFontesQueInformam(t *testing.T) {
	s := bancoDeTeste(t)
	ctx := context.Background()
	resultados := []coleta.Resultado{
		{FonteID: "prosangue", Leituras: []coleta.Leitura{{Tipo: "O-", Nivel: httpapi.Critico}},
			Bolsas: map[httpapi.TipoSanguineo]coleta.Contagem{"O-": {Bolsas: 25, Minimo: 103}}},
		{FonteID: "hemoba", Leituras: []coleta.Leitura{{Tipo: "O-", Nivel: httpapi.Critico}}},
	}

	if err := s.GravarColeta(ctx, resultados, agoraFixo); err != nil {
		t.Fatal(err)
	}

	estoque, err := s.EstoqueAtual(ctx, "")
	if err != nil {
		t.Fatal(err)
	}
	porID := map[string]httpapi.EstoqueHemocentro{}
	for _, h := range estoque {
		porID[h.Id] = h
	}
	if b := porID["prosangue"].Bolsas; b == nil || (*b)["O-"] != (httpapi.Bolsas{Bolsas: 25, Minimo: 103}) {
		t.Errorf("bolsas da Pró-Sangue = %v", b)
	}
	if b := porID["hemoba"].Bolsas; b != nil {
		t.Errorf("Hemoba não publica bolsas, veio %v", *b)
	}
}

func TestGravarColetaNaoGravaNadaQuandoUmaLeituraFalha(t *testing.T) {
	s := bancoDeTeste(t)
	ctx := context.Background()
	resultados := []coleta.Resultado{
		{FonteID: "hemoba", Leituras: []coleta.Leitura{{Tipo: "O-", Nivel: httpapi.Critico}}},
		{FonteID: "nao-cadastrada", Leituras: []coleta.Leitura{{Tipo: "O-", Nivel: httpapi.Critico}}},
	}

	err := s.GravarColeta(ctx, resultados, agoraFixo)

	if err == nil {
		t.Fatal("aceitou leitura de hemocentro que não existe")
	}
	if estoque, _ := s.EstoqueAtual(ctx, ""); len(estoque) != 0 {
		t.Errorf("gravou parte da coleta: %+v", estoque)
	}
}

func TestPontosColetaDaMigrationCobremOs27EstadosComOsPublicosPrimeiro(t *testing.T) {
	s := bancoDeTeste(t)
	ctx := context.Background()

	var ufs int
	if err := s.pool.QueryRow(ctx, `SELECT count(DISTINCT uf) FROM pontos_coleta`).Scan(&ufs); err != nil {
		t.Fatal(err)
	}
	if ufs != 27 {
		t.Errorf("UFs com ponto de coleta = %d, quero 27", ufs)
	}
	pontos, err := s.PontosColeta(ctx, "MG")
	if err != nil {
		t.Fatal(err)
	}
	if len(pontos) == 0 || !pontos[0].Publico || pontos[len(pontos)-1].Publico {
		t.Errorf("MG: %d pontos, primeiro público %v, último público %v", len(pontos), pontos[0].Publico, pontos[len(pontos)-1].Publico)
	}
}

func TestGravarAlertasNaoDuplicaEListaOsRecentes(t *testing.T) {
	s := bancoDeTeste(t)
	ctx := context.Background()
	noticias := []coleta.Noticia{
		{FonteID: "sesap-rn", UF: "RN", Titulo: "Estoque crítico", URL: "https://rn.gov.br/1", PublicadaEm: agoraFixo.AddDate(0, 0, -2)},
		{FonteID: "sesap-rn", UF: "RN", Titulo: "Estoque baixo", URL: "https://rn.gov.br/2", PublicadaEm: agoraFixo.AddDate(0, 0, -40)},
	}

	for range 2 {
		if err := s.GravarAlertas(ctx, noticias, agoraFixo); err != nil {
			t.Fatal(err)
		}
	}

	alertas, err := s.Alertas(ctx, "RN", agoraFixo.AddDate(0, 0, -30))
	if err != nil {
		t.Fatal(err)
	}
	if len(alertas) != 1 || alertas[0].Url != "https://rn.gov.br/1" || alertas[0].Fonte != "sesap-rn" {
		t.Errorf("alertas = %+v", alertas)
	}
}
