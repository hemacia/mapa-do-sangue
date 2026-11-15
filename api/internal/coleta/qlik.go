package coleta

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"golang.org/x/net/websocket"

	"github.com/hemacia/mapa-do-sangue/api/internal/httpapi"
)

// O Hemosul publica o estoque num painel Qlik Sense que aceita sessão anônima.
// A Engine API fala JSON-RPC por WebSocket: abre o app, cria um cubo e lê a primeira página.
const (
	servidorHemosul = "paineispublicos.saude.ms.gov.br"
	appHemosul      = "2e7b9a90-9431-4bef-90ca-8116ef40f46b"
)

// Bolsas de hemácias, estoque estratégico e a data da carga (igual em todas as linhas por causa do TOTAL).
var cuboHemosul = map[string]any{
	"qInfo": map[string]string{"qType": "estoque"},
	"qHyperCubeDef": map[string]any{
		"qDimensions": []any{map[string]any{"qDef": map[string]any{"qFieldDefs": []string{"[Tipagem/Fator RH]"}}}},
		"qMeasures": []any{
			map[string]any{"qDef": map[string]string{"qDef": "Sum(Real_h)"}},
			map[string]any{"qDef": map[string]string{"qDef": "Sum([Estratégico_h])"}},
			map[string]any{"qDef": map[string]string{"qDef": "MaxString(TOTAL Data)"}},
		},
		"qInitialDataFetch": []any{map[string]int{"qTop": 0, "qLeft": 0, "qWidth": 4, "qHeight": 20}},
	},
}

func obterHemosul(ctx context.Context, _ Baixar) ([]byte, error) {
	return consultarQlik(ctx, "wss://"+servidorHemosul+"/app/"+appHemosul, "https://"+servidorHemosul, appHemosul, cuboHemosul)
}

type respostaRPC struct {
	ID     int             `json:"id"`
	Result json.RawMessage `json:"result"`
	Error  *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// Devolve a matriz (qMatrix) do cubo em JSON.
func consultarQlik(ctx context.Context, url, origem, app string, cubo any) ([]byte, error) {
	config, err := websocket.NewConfig(url, origem)
	if err != nil {
		return nil, err
	}
	conexao, err := config.DialContext(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = conexao.Close() }()
	prazo, ok := ctx.Deadline()
	if !ok {
		prazo = time.Now().Add(30 * time.Second)
	}
	if err := conexao.SetDeadline(prazo); err != nil {
		return nil, err
	}

	id := 0
	chamar := func(handle int, metodo string, params ...any) (json.RawMessage, error) {
		id++
		if params == nil {
			params = []any{} // o motor recusa "params": null
		}
		pedido := map[string]any{"jsonrpc": "2.0", "id": id, "handle": handle, "method": metodo, "params": params}
		if err := websocket.JSON.Send(conexao, pedido); err != nil {
			return nil, err
		}
		for {
			var resposta respostaRPC
			if err := websocket.JSON.Receive(conexao, &resposta); err != nil {
				return nil, err
			}
			// Notificações (OnConnected, mudanças de estado) chegam sem id.
			if resposta.ID != id {
				continue
			}
			if resposta.Error != nil {
				return nil, fmt.Errorf("Qlik %s: %s", metodo, resposta.Error.Message) //nolint:staticcheck // nome do produto
			}
			return resposta.Result, nil
		}
	}
	var retorno struct {
		QReturn struct {
			QHandle int `json:"qHandle"`
		} `json:"qReturn"`
	}
	resultado, err := chamar(-1, "OpenDoc", app)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(resultado, &retorno); err != nil {
		return nil, err
	}
	if resultado, err = chamar(retorno.QReturn.QHandle, "CreateSessionObject", cubo); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(resultado, &retorno); err != nil {
		return nil, err
	}
	if resultado, err = chamar(retorno.QReturn.QHandle, "GetLayout"); err != nil {
		return nil, err
	}
	var layout struct {
		QLayout struct {
			QHyperCube struct {
				QDataPages []struct {
					QMatrix json.RawMessage `json:"qMatrix"`
				} `json:"qDataPages"`
			} `json:"qHyperCube"`
		} `json:"qLayout"`
	}
	if err := json.Unmarshal(resultado, &layout); err != nil {
		return nil, err
	}
	if len(layout.QLayout.QHyperCube.QDataPages) == 0 {
		return nil, errors.New("Qlik: cubo sem dados") //nolint:staticcheck // nome do produto
	}
	return layout.QLayout.QHyperCube.QDataPages[0].QMatrix, nil
}

// O painel limita as bolsas ao estoque estratégico: um tipo cheio aparece com bolsas = estratégico,
// sem mostrar o excesso. Então só o que está abaixo vira número; o resto fica como estável.
func lerHemosul(texto string, _ time.Time) (Resultado, error) {
	var matriz [][]struct {
		QText string `json:"qText"`
	}
	if err := json.Unmarshal([]byte(texto), &matriz); err != nil {
		return Resultado{}, fmt.Errorf("Hemosul: %w", err)
	}
	var leituras []Leitura
	bolsas := map[httpapi.TipoSanguineo]Contagem{}
	atualizado := ""
	for _, linha := range matriz {
		if len(linha) < 4 {
			continue
		}
		tipo, okT := normalizarTipo(linha[0].QText)
		real, errR := strconv.Atoi(linha[1].QText)
		estrategico, errE := strconv.Atoi(linha[2].QText)
		if !okT || errR != nil || errE != nil {
			continue
		}
		nivel := httpapi.Estavel
		if real < estrategico {
			nivel = nivelPeloMinimo(real, estrategico)
			bolsas[tipo] = Contagem{Bolsas: real, Minimo: estrategico}
		}
		leituras = append(leituras, Leitura{tipo, nivel})
		atualizado = extrairDataBR(linha[3].QText)
	}
	resultado, err := comLeituras("Hemosul", leituras, atualizado)
	resultado.Bolsas = bolsas
	return resultado, err
}
