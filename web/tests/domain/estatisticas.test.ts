import { describe, expect, it } from 'vitest'
import { classificarCobertura, faixaDeColetas, posicaoNoRanking, taxaPorMil } from '@/lib/domain/estatisticas'
import { siglaDaUF } from '@/lib/domain/ufs'

describe('taxaPorMil', () => {
  it('calcula coletas por mil habitantes com uma casa decimal', () => {
    expect(taxaPorMil(89_062, 4_102_129)).toBe(21.7)
  })

  it('devolve null sem população', () => {
    expect(taxaPorMil(100, 0)).toBeNull()
  })
})

describe('classificarCobertura', () => {
  it('marca como incompleto quando a taxa é baixa demais para ser real', () => {
    expect(classificarCobertura(1.8)).toBe('incompleto')
  })

  it('considera completo a partir de 5 coletas por mil', () => {
    expect(classificarCobertura(5)).toBe('completo')
  })

  it('marca como sem dado quando a UF não enviou nada', () => {
    expect(classificarCobertura(null)).toBe('sem-dado')
  })
})

describe('siglaDaUF', () => {
  it.each([
    ['Espírito Santo', 'ES'],
    ['são paulo', 'SP'],
    ['Distrito Federal', 'DF'],
  ])('converte %s em %s', (nome, sigla) => {
    expect(siglaDaUF(nome)).toBe(sigla)
  })

  it('devolve null para nome desconhecido', () => {
    expect(siglaDaUF('Atlântida')).toBeNull()
  })
})

describe('faixaDeColetas', () => {
  it.each([
    [9, 0],
    [12, 1],
    [16.2, 2],
    [18.6, 3],
    [26.9, 4],
  ])('põe %s coletas por mil na faixa %s', (porMil, faixa) => {
    expect(faixaDeColetas(porMil, 'completo')).toBe(faixa)
  })

  it('separa o envio incompleto e o estado sem dado', () => {
    expect(faixaDeColetas(0, 'incompleto')).toBe('incompleto')
    expect(faixaDeColetas(null, 'sem-dado')).toBeNull()
  })

  it('não põe em faixa nenhuma o estado sem dado, mesmo que venha uma taxa', () => {
    expect(faixaDeColetas(16, 'sem-dado')).toBeNull()
  })

  it('não põe em faixa nenhuma o estado completo sem taxa', () => {
    expect(faixaDeColetas(null, 'completo')).toBeNull()
  })
})

describe('posicaoNoRanking', () => {
  const ESTADOS = [
    { uf: 'PB', porMil: 26.9, cobertura: 'completo' as const },
    { uf: 'MG', porMil: 16.2, cobertura: 'completo' as const },
    { uf: 'BA', porMil: 9, cobertura: 'completo' as const },
    { uf: 'RJ', porMil: 0, cobertura: 'incompleto' as const },
  ]

  it('dá a posição entre os estados com envio completo e a mediana deles', () => {
    expect(posicaoNoRanking(ESTADOS, 'MG')).toEqual({ posicao: 2, total: 3, mediana: 16.2 })
  })

  it('tira a média dos dois do meio quando o total é par', () => {
    expect(posicaoNoRanking(ESTADOS.slice(0, 2), 'PB')?.mediana).toBeCloseTo(21.55)
  })

  it('não ranqueia estado com envio incompleto', () => {
    expect(posicaoNoRanking(ESTADOS, 'RJ')).toBeNull()
  })

  it('ordena pela taxa mesmo quando os estados chegam fora de ordem', () => {
    const foraDeOrdem = [ESTADOS[2], ESTADOS[0], ESTADOS[1]]

    expect(posicaoNoRanking(foraDeOrdem, 'PB')).toEqual({ posicao: 1, total: 3, mediana: 16.2 })
  })

  it('deixa fora do ranking o estado completo que veio sem taxa', () => {
    const semTaxa = { uf: 'SP', porMil: null, cobertura: 'completo' as const }

    expect(posicaoNoRanking([...ESTADOS, semTaxa], 'MG')).toEqual({ posicao: 2, total: 3, mediana: 16.2 })
  })
})
