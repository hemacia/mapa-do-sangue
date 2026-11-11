import { describe, expect, it } from 'vitest'
import { TIPOS_SANGUINEOS, normalizarTipo } from '../../src/domain/tipos'

describe('TIPOS_SANGUINEOS', () => {
  it('lista os oito tipos ABO/Rh', () => {
    expect(TIPOS_SANGUINEOS).toHaveLength(8)
  })
})

describe('normalizarTipo', () => {
  it.each([
    ['A+', 'A+'],
    ['ab-', 'AB-'],
    ['O –', 'O-'],
    ['B positivo', 'B+'],
    ['AB NEGATIVO', 'AB-'],
    ['Sangue tipo O-', 'O-'],
    ['Tipo A Neg', 'A-'],
  ])('reconhece "%s" como %s', (texto, esperado) => {
    expect(normalizarTipo(texto)).toBe(esperado)
  })

  it('não confunde AB com B', () => {
    expect(normalizarTipo('AB+')).toBe('AB+')
  })

  it('devolve null para texto sem tipo sanguíneo', () => {
    expect(normalizarTipo('Plaquetas')).toBeNull()
  })

  it('devolve null quando falta o fator Rh', () => {
    expect(normalizarTipo('Tipo A')).toBeNull()
  })
})
