import { describe, expect, it } from 'vitest'
import { agregarColetasPorUF } from '../../../src/estatisticas/hemoprod'

const CABECALHO = [
  'Data de envio', 'Ano de referência', 'Período de referência', 'Razão Social - Nome Fantasia', 'CNPJ',
  '3.3 Total de coletas [Sangue total]', '3.3 Total de coletas [Por aférese]', 'Unidade Federativa',
].join(';')

function linha(envio: string, ano: string, periodo: string, nome: string, total: string, aferese: string, uf: string) {
  return [envio, ano, periodo, nome, '00.000.000/0001-00', total, aferese, uf].join(';')
}

function csv(...linhas: string[]) {
  return [CABECALHO, ...linhas].join('\n')
}

describe('agregarColetasPorUF', () => {
  it('soma sangue total e aférese de todos os meses por estado', () => {
    const texto = csv(
      linha('2024-02-01', '2024', 'Janeiro', 'Hemo A', '100', '5', 'Espírito Santo'),
      linha('2024-03-01', '2024', 'Fevereiro', 'Hemo A', '200', '0', 'Espírito Santo'),
    )

    expect(agregarColetasPorUF(texto, 2024)).toEqual({ ES: 305 })
  })

  it('ignora outros anos', () => {
    const texto = csv(linha('2023-02-01', '2023', 'Janeiro', 'Hemo A', '100', '0', 'Bahia'))

    expect(agregarColetasPorUF(texto, 2024)).toEqual({})
  })

  it('fica só com o envio mais recente quando o mesmo mês foi retificado', () => {
    const texto = csv(
      linha('2024-02-01', '2024', 'Janeiro', 'Hemo A', '100', '0', 'Bahia'),
      linha('2024-05-01', '2024', 'Janeiro', 'Hemo A', '120', '0', 'Bahia'),
    )

    expect(agregarColetasPorUF(texto, 2024)).toEqual({ BA: 120 })
  })

  it('usa o consolidado anual e ignora os meses do mesmo estabelecimento', () => {
    const texto = csv(
      linha('2025-01-10', '2024', 'Consolidado', 'Hemo SP', '1000', '0', 'São Paulo'),
      linha('2024-02-01', '2024', 'Janeiro', 'Hemo SP', '90', '0', 'São Paulo'),
    )

    expect(agregarColetasPorUF(texto, 2024)).toEqual({ SP: 1000 })
  })

  it('trata campo vazio como zero', () => {
    const texto = csv(linha('2024-02-01', '2024', 'Janeiro', 'Hemo A', '', '7', 'Pará'))

    expect(agregarColetasPorUF(texto, 2024)).toEqual({ PA: 7 })
  })

  it('falha quando falta uma coluna esperada', () => {
    expect(() => agregarColetasPorUF('a;b\n1;2', 2024)).toThrow('Coluna não encontrada')
  })
})
