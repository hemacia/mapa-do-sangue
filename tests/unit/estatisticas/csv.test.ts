import { describe, expect, it } from 'vitest'
import { lerCSV } from '../../../src/estatisticas/csv'

describe('lerCSV', () => {
  it('separa linhas e colunas por ponto e vírgula', () => {
    expect(lerCSV('a;b\n1;2\n')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('aceita quebra de linha do Windows', () => {
    expect(lerCSV('a;b\r\n1;2')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('mantém ponto e vírgula e quebra de linha dentro de aspas', () => {
    expect(lerCSV('obs;n\n"linha 1;\nlinha 2";3')).toEqual([['obs', 'n'], ['linha 1;\nlinha 2', '3']])
  })

  it('converte aspas duplicadas em uma aspa', () => {
    expect(lerCSV('"diz ""oi""";x')).toEqual([['diz "oi"', 'x']])
  })

  it('remove o BOM do início do arquivo', () => {
    expect(lerCSV('﻿a;b')).toEqual([['a', 'b']])
  })
})
