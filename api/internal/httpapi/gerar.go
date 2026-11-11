// Package httpapi expõe a API HTTP. O servidor é gerado a partir de openapi.yaml.
package httpapi

//go:generate go tool oapi-codegen -config ../../oapi-codegen.yaml ../../openapi.yaml
