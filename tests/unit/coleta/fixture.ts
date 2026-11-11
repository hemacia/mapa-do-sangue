import { readFileSync } from 'node:fs'

// Páginas reais salvas em tests/fixtures: os testes nunca acessam a internet.
export function lerFixture(nome: string, codificacao: 'utf-8' | 'latin1' = 'utf-8'): string {
  const bytes = readFileSync(new URL(`../../fixtures/${nome}`, import.meta.url))
  return new TextDecoder(codificacao).decode(bytes)
}
