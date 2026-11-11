// Leitor de CSV mínimo (RFC 4180) para o arquivo da Anvisa: campos entre aspas
// podem ter ";" e quebras de linha, e aspas escapadas como "".
export function lerCSV(texto: string, separador = ';'): string[][] {
  const linhas: string[][] = []
  let linha: string[] = []
  let campo = ''
  let entreAspas = false
  const conteudo = texto.replace(/^﻿/, '')

  for (let i = 0; i < conteudo.length; i++) {
    const c = conteudo[i]
    if (entreAspas) {
      if (c === '"' && conteudo[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') entreAspas = false
      else campo += c
    } else if (c === '"') entreAspas = true
    else if (c === separador) {
      linha.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && conteudo[i + 1] === '\n') i++
      linha.push(campo)
      linhas.push(linha)
      linha = []
      campo = ''
    } else campo += c
  }
  if (campo !== '' || linha.length > 0) {
    linha.push(campo)
    linhas.push(linha)
  }
  return linhas
}
