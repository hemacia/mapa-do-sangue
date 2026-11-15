package coleta

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"
)

func baixarFixtures(t *testing.T) Baixar {
	return func(_ context.Context, url string) ([]byte, error) {
		for _, f := range Fontes {
			if f.URL == url {
				return fixture(t, f.fixture()), nil
			}
		}
		return nil, errors.New("url desconhecida")
	}
}

// Fontes com as conexões próprias (Qlik) trocadas pelo arquivo salvo.
func fontesOffline(t *testing.T) []Fonte {
	fontes := slices.Clone(Fontes)
	for i, f := range fontes {
		if f.obter != nil {
			fontes[i].obter = func(context.Context, Baixar) ([]byte, error) { return fixture(t, f.fixture()), nil }
		}
	}
	return fontes
}

func TestColetarTodasLeTodasAsFontesNaOrdem(t *testing.T) {
	resultados := ColetarTodas(context.Background(), fontesOffline(t), baixarFixtures(t), coletadoEm)

	total := 0
	for i, r := range resultados {
		if r.Erro != nil || r.FonteID != Fontes[i].ID {
			t.Errorf("%s: %v", r.FonteID, r.Erro)
		}
		total += len(r.Leituras)
	}
	if total != 8*len(Fontes) {
		t.Errorf("leituras = %d, quero 8 por fonte", total)
	}
}

func TestColetarTodasContinuaQuandoUmaFonteFalha(t *testing.T) {
	baixar := baixarFixtures(t)
	comFalha := func(ctx context.Context, url string) ([]byte, error) {
		if strings.Contains(url, "hemominas") {
			return nil, errors.New("tempo esgotado")
		}
		return baixar(ctx, url)
	}

	resultados := ColetarTodas(context.Background(), fontesOffline(t), comFalha, coletadoEm)

	ok := 0
	for _, r := range resultados {
		if r.FonteID == "hemominas" && (r.Erro == nil || r.Erro.Error() != "tempo esgotado") {
			t.Errorf("hemominas: %v", r.Erro)
		}
		if r.Erro == nil {
			ok++
		}
	}
	if ok != len(Fontes)-1 {
		t.Errorf("fontes ok = %d, quero todas menos uma", ok)
	}
}

func TestBaixarHTTPMandaUserAgentEFalhaComStatusDeErro(t *testing.T) {
	var userAgent string
	servidor := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userAgent = r.UserAgent()
		if r.URL.Path == "/fora" {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		_, _ = w.Write([]byte("ok"))
	}))
	defer servidor.Close()
	baixar := BaixarHTTP(servidor.Client())

	corpo, err := baixar(context.Background(), servidor.URL)
	_, errFora := baixar(context.Background(), servidor.URL+"/fora")

	if err != nil || string(corpo) != "ok" {
		t.Errorf("corpo = %q, erro = %v", corpo, err)
	}
	if !strings.HasPrefix(userAgent, "MapaDoSangue/") {
		t.Errorf("user agent = %q", userAgent)
	}
	if errFora == nil || errFora.Error() != "HTTP 503" {
		t.Errorf("erro = %v", errFora)
	}
}

func TestClienteHTTPConfiaNaCAIntermediariaDoHemosc(t *testing.T) {
	cliente, err := ClienteHTTP()
	if err != nil {
		t.Fatal(err)
	}

	transporte := cliente.Transport.(*http.Transport)

	if transporte.TLSClientConfig.InsecureSkipVerify || transporte.TLSClientConfig.RootCAs == nil {
		t.Error("cliente sem a CA do Hemosc ou sem verificação TLS")
	}
}

func TestColetarTentaDeNovoQuandoODownloadFalha(t *testing.T) {
	tentativas := 0
	baixar := func(_ context.Context, _ string) ([]byte, error) {
		tentativas++
		if tentativas == 1 {
			return nil, errors.New("tempo esgotado")
		}
		return fixture(t, "hemoba.html"), nil
	}
	fonte := Fontes[slices.IndexFunc(Fontes, func(f Fonte) bool { return f.ID == "hemoba" })]

	r := ColetarTodas(context.Background(), []Fonte{fonte}, baixar, coletadoEm)[0]

	if r.Erro != nil || tentativas != 2 {
		t.Errorf("erro = %v, tentativas = %d", r.Erro, tentativas)
	}
}
