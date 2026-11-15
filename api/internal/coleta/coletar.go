package coleta

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	_ "embed"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

type Baixar func(ctx context.Context, url string) ([]byte, error)

// Uma fonte fora do ar não pode impedir a coleta das outras. Os resultados saem na ordem das fontes.
func ColetarTodas(ctx context.Context, fontes []Fonte, baixar Baixar, coletadoEm time.Time) []Resultado {
	resultados := make([]Resultado, len(fontes))
	var grupo sync.WaitGroup
	for i, fonte := range fontes {
		grupo.Go(func() {
			resultado, err := coletar(ctx, fonte, baixar, coletadoEm)
			resultado.FonteID, resultado.Erro = fonte.ID, err
			resultados[i] = resultado
		})
	}
	grupo.Wait()
	return resultados
}

func coletar(ctx context.Context, fonte Fonte, baixar Baixar, coletadoEm time.Time) (Resultado, error) {
	var corpo []byte
	var err error
	if fonte.obter != nil {
		corpo, err = fonte.obter(ctx)
	} else if corpo, err = baixar(ctx, fonte.URL); err != nil && ctx.Err() == nil {
		// Site do governo que demora a responder costuma voltar na segunda tentativa.
		corpo, err = baixar(ctx, fonte.URL)
	}
	if err != nil {
		return Resultado{}, err
	}
	return fonte.ler(fonte.decodificar(corpo), coletadoEm)
}

const userAgent = "MapaDoSangue/0.1 (+https://github.com/hemacia/mapa-do-sangue)"

// Limite por página: a maior fonte tem uns 200 KB.
const tamanhoMaximo = 5 << 20

func BaixarHTTP(cliente *http.Client) Baixar {
	return func(ctx context.Context, url string) ([]byte, error) {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("User-Agent", userAgent)
		resp, err := cliente.Do(req) //nolint:gosec // URLs fixas da lista de fontes
		if err != nil {
			return nil, err
		}
		defer func() { _ = resp.Body.Close() }()
		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
		}
		return io.ReadAll(io.LimitReader(resp.Body, tamanhoMaximo))
	}
}

// O servidor do Hemosc não manda a CA intermediária da Sectigo, e o Go não busca a que falta.
// Ela entra no pool junto com as do sistema, sem desligar a verificação TLS.
//
//go:embed sectigo-dv-r36.pem
var caHemosc []byte

func ClienteHTTP() (*http.Client, error) {
	pool, err := x509.SystemCertPool()
	if err != nil {
		return nil, err
	}
	if !pool.AppendCertsFromPEM(caHemosc) {
		return nil, errors.New("CA do Hemosc inválida")
	}
	transporte := http.DefaultTransport.(*http.Transport).Clone()
	transporte.TLSClientConfig = &tls.Config{RootCAs: pool, MinVersion: tls.VersionTLS12}
	return &http.Client{Transport: transporte, Timeout: 30 * time.Second}, nil
}
