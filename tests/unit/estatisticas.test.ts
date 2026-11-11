import { describe, expect, it } from 'vitest'
import { classificarCobertura, taxaPorMil } from '../../src/domain/estatisticas'
import { siglaDaUF } from '../../src/domain/ufs'

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
