import { describe, expect, it } from 'vitest'
import { formatarData, parseData } from '../../src/domain/datas'
import { avaliarIdade, avaliarPeso, proximaDataApta } from '../../src/domain/elegibilidade'

const HOJE = parseData('2026-11-10')

function nascidoEm(texto: string) {
  return parseData(texto)
}

describe('avaliarIdade', () => {
  it('é inapto um dia antes de completar 16 anos', () => {
    expect(avaliarIdade(nascidoEm('2010-11-11'), HOJE, false)).toBe('inapto')
  })

  it('exige consentimento do responsável no dia em que completa 16 anos', () => {
    expect(avaliarIdade(nascidoEm('2010-11-10'), HOJE, false)).toBe('apto_com_consentimento')
  })

  it('exige consentimento aos 17 anos', () => {
    expect(avaliarIdade(nascidoEm('2009-01-01'), HOJE, false)).toBe('apto_com_consentimento')
  })

  it('é apto aos 18 anos', () => {
    expect(avaliarIdade(nascidoEm('2008-11-10'), HOJE, false)).toBe('apto')
  })

  it('aceita primeira doação aos 60 anos', () => {
    expect(avaliarIdade(nascidoEm('1965-11-11'), HOJE, false)).toBe('apto')
  })

  it('recusa primeira doação aos 61 anos', () => {
    expect(avaliarIdade(nascidoEm('1965-11-10'), HOJE, false)).toBe('inapto')
  })

  it('aceita doador de repetição aos 69 anos', () => {
    expect(avaliarIdade(nascidoEm('1957-01-01'), HOJE, true)).toBe('apto')
  })

  it('pede avaliação médica para doador de repetição a partir dos 70 anos', () => {
    expect(avaliarIdade(nascidoEm('1956-11-10'), HOJE, true)).toBe('apto_com_avaliacao_medica')
  })

  it('rejeita data de nascimento no futuro', () => {
    expect(() => avaliarIdade(nascidoEm('2027-01-01'), HOJE, false)).toThrow()
  })
})

describe('avaliarPeso', () => {
  it('é apto com exatamente 50 kg', () => {
    expect(avaliarPeso(50)).toBe('apto')
  })

  it('pede avaliação médica abaixo de 50 kg', () => {
    expect(avaliarPeso(49.9)).toBe('apto_com_avaliacao_medica')
  })

  it.each([0, -10, Number.NaN])('rejeita peso inválido %s', (peso) => {
    expect(() => avaliarPeso(peso)).toThrow('Peso inválido')
  })
})

describe('proximaDataApta', () => {
  const datas = (...textos: string[]) => textos.map(parseData)

  it('devolve null para quem nunca doou', () => {
    expect(proximaDataApta([], 'masculino')).toBeNull()
  })

  it('homem espera 2 meses desde a última doação', () => {
    const proxima = proximaDataApta(datas('2026-09-10'), 'masculino')

    expect(formatarData(proxima!)).toBe('2026-11-10')
  })

  it('mulher espera 3 meses desde a última doação', () => {
    const proxima = proximaDataApta(datas('2026-09-10'), 'feminino')

    expect(formatarData(proxima!)).toBe('2026-12-10')
  })

  it('conta o intervalo em meses e não em dias', () => {
    const proxima = proximaDataApta(datas('2026-12-31'), 'masculino')

    expect(formatarData(proxima!)).toBe('2027-02-28')
  })

  it('usa a doação mais recente mesmo fora de ordem', () => {
    const proxima = proximaDataApta(datas('2026-09-10', '2026-01-10'), 'masculino')

    expect(formatarData(proxima!)).toBe('2026-11-10')
  })

  it('homem com 4 doações em 12 meses espera a mais antiga sair da janela', () => {
    const doacoes = datas('2026-01-05', '2026-03-05', '2026-05-05', '2026-07-05')

    const proxima = proximaDataApta(doacoes, 'masculino')

    expect(formatarData(proxima!)).toBe('2027-01-05')
  })

  it('mulher com 3 doações em 12 meses espera a mais antiga sair da janela', () => {
    const doacoes = datas('2026-01-05', '2026-04-05', '2026-07-05')

    const proxima = proximaDataApta(doacoes, 'feminino')

    expect(formatarData(proxima!)).toBe('2027-01-05')
  })

  it('ignora doações antigas que já saíram da janela de 12 meses', () => {
    const doacoes = datas('2024-01-05', '2024-03-05', '2024-05-05', '2026-07-05')

    const proxima = proximaDataApta(doacoes, 'masculino')

    expect(formatarData(proxima!)).toBe('2026-09-05')
  })
})
