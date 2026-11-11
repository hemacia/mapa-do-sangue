// Package migrations embute os arquivos SQL no binário para a API aplicá-los ao iniciar.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
