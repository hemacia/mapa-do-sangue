package coleta

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"

	"golang.org/x/net/websocket"

	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
)

func TestHemosulSoDaNumeroAosTiposAbaixoDoEstrategico(t *testing.T) {
	r := ler(t, "hemosul")

	// O- 18 de 53; os outros vêm com bolsas = estratégico porque o painel corta o excesso.
	querLeituras(t, r, 8, Leitura{"O-", httpapi.Critico}, Leitura{"O+", httpapi.Estavel})
	if len(r.Bolsas) != 1 || r.Bolsas["O-"] != (Contagem{Bolsas: 18, Minimo: 53}) {
		t.Errorf("bolsas = %v", r.Bolsas)
	}
	if r.AtualizadoNaFonte != "2026-11-12T07:39" {
		t.Errorf("data = %q", r.AtualizadoNaFonte)
	}
}

func TestHemosulFalhaComCuboVazio(t *testing.T) {
	_, err := lerHemosul("[]", coletadoEm)

	if err == nil || !strings.Contains(err.Error(), "Hemosul") {
		t.Errorf("erro = %v", err)
	}
}

// Servidor que imita a Engine API: avisa OnConnected sem id e responde cada método na ordem.
func servidorQlik(t *testing.T, respostas map[string]string) string {
	t.Helper()
	servidor := httptest.NewServer(websocket.Handler(func(ws *websocket.Conn) {
		_ = websocket.Message.Send(ws, `{"jsonrpc":"2.0","method":"OnConnected","params":{"qSessionState":"SESSION_CREATED"}}`)
		for {
			var pedido struct {
				ID     int    `json:"id"`
				Method string `json:"method"`
				Params []any  `json:"params"`
			}
			if websocket.JSON.Receive(ws, &pedido) != nil {
				return
			}
			if pedido.Params == nil {
				_ = websocket.Message.Send(ws, `{"jsonrpc":"2.0","id":0,"error":{"message":"JSON parse error"}}`)
				return
			}
			corpo, _ := json.Marshal(pedido.ID)
			_ = websocket.Message.Send(ws, `{"jsonrpc":"2.0","id":`+string(corpo)+`,`+respostas[pedido.Method]+`}`)
		}
	}))
	t.Cleanup(servidor.Close)
	return "ws" + strings.TrimPrefix(servidor.URL, "http")
}

func TestConsultarQlikAbreOAppCriaOCuboEDevolveAMatriz(t *testing.T) {
	url := servidorQlik(t, map[string]string{
		"OpenDoc":             `"result":{"qReturn":{"qHandle":1}}`,
		"CreateSessionObject": `"result":{"qReturn":{"qHandle":2}}`,
		"GetLayout":           `"result":{"qLayout":{"qHyperCube":{"qDataPages":[{"qMatrix":[[{"qText":"O-"}]]}]}}}`,
	})

	matriz, err := consultarQlik(context.Background(), url, "http://localhost", "app", cuboHemosul)

	if err != nil || string(matriz) != `[[{"qText":"O-"}]]` {
		t.Errorf("matriz = %s, erro = %v", matriz, err)
	}
}

func TestConsultarQlikRepassaOErroDoMotor(t *testing.T) {
	url := servidorQlik(t, map[string]string{
		"OpenDoc": `"error":{"code":1002,"message":"App already open"}`,
	})

	_, err := consultarQlik(context.Background(), url, "http://localhost", "app", cuboHemosul)

	if err == nil || !strings.Contains(err.Error(), "App already open") {
		t.Errorf("erro = %v", err)
	}
}
