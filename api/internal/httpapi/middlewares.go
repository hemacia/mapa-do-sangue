package httpapi

import (
	"log/slog"
	"net"
	"net/http"
	"sync"
	"time"
)

func seguranca(proximo http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "no-referrer")
		h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		r.Body = http.MaxBytesReader(w, r.Body, 16<<10) // nenhuma rota precisa de corpo maior
		proximo.ServeHTTP(w, r)
	})
}

// Só o site chama a API pelo navegador; outras origens não recebem permissão.
func cors(origemPermitida string, proximo http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Origin") == origemPermitida {
			w.Header().Set("Access-Control-Allow-Origin", origemPermitida)
			w.Header().Set("Vary", "Origin")
		}
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Max-Age", "86400")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		proximo.ServeHTTP(w, r)
	})
}

// limitador conta requisições por IP numa janela fixa. O mapa é zerado a cada janela,
// então a memória não cresce além dos IPs de um minuto.
type limitador struct {
	mu       sync.Mutex
	maximo   int
	janela   time.Duration
	agora    func() time.Time
	inicio   time.Time
	contagem map[string]int
}

func novoLimitador(maximo int, janela time.Duration, agora func() time.Time) *limitador {
	return &limitador{maximo: maximo, janela: janela, agora: agora, contagem: map[string]int{}}
}

func (l *limitador) permitir(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	if agora := l.agora(); agora.Sub(l.inicio) >= l.janela {
		l.inicio = agora
		clear(l.contagem)
	}
	l.contagem[ip]++
	return l.contagem[ip] <= l.maximo
}

func limitarDoacoes(l *limitador, proximo http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.URL.Path == "/v1/doacoes" && !l.permitir(ipDoCliente(r)) {
			w.Header().Set("Retry-After", "60")
			escreverProblema(w, http.StatusTooManyRequests, "Muitas doações registradas", "Tente de novo em um minuto")
			return
		}
		proximo.ServeHTTP(w, r)
	})
}

// A API só recebe tráfego pelo Cloudflare Tunnel, então o CF-Connecting-IP é confiável.
// Sem ele (ambiente local), vale o endereço da conexão.
func ipDoCliente(r *http.Request) string {
	if ip := r.Header.Get("CF-Connecting-IP"); ip != "" {
		return ip
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

type respostaComStatus struct {
	http.ResponseWriter
	status int
}

func (r *respostaComStatus) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func registrarAcesso(log *slog.Logger, proximo http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		inicio := time.Now()
		resp := &respostaComStatus{ResponseWriter: w, status: http.StatusOK}
		proximo.ServeHTTP(resp, r)
		log.InfoContext(r.Context(), "requisição",
			"metodo", r.Method, "rota", r.URL.Path, "status", resp.status,
			"duracao_ms", time.Since(inicio).Milliseconds())
	})
}
