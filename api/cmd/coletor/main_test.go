package main

import "testing"

func TestEscaparComandoImpedeQuebraDeLinhaNaAnotacao(t *testing.T) {
	got := escaparComando("falhou\n::add-mask::x 100%\r")

	if got != "falhou%0A::add-mask::x 100%25%0D" {
		t.Errorf("escapado = %q", got)
	}
}
