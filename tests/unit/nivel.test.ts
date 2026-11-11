import { describe, expect, it } from 'vitest'
import { nivelMaisGrave, normalizarNivel } from '../../src/domain/nivel'

describe('normalizarNivel', () => {
  it.each([
    ['Crítico', 'critico'],
    ['CRITICO', 'critico'],
    ['Emergência', 'critico'],
    ['Alerta', 'alerta'],
    ['Reduzido', 'alerta'],
    ['Regular', 'alerta'],
    ['Estável', 'estavel'],
    ['Adequado', 'adequado'],
  ])('converte "%s" para %s', (texto, esperado) => {
    expect(normalizarNivel(texto)).toBe(esperado)
  })

  it('ignora espaços nas pontas', () => {
    expect(normalizarNivel('  estável \n')).toBe('estavel')
  })

  it('devolve null para nível desconhecido', () => {
    expect(normalizarNivel('Carregando...')).toBeNull()
  })
})

describe('nivelMaisGrave', () => {
  it('escolhe crítico quando existe algum', () => {
    expect(nivelMaisGrave(['estavel', 'critico', 'alerta'])).toBe('critico')
  })

  it('escolhe alerta entre alerta e adequado', () => {
    expect(nivelMaisGrave(['adequado', 'alerta'])).toBe('alerta')
  })

  it('devolve null para lista vazia', () => {
    expect(nivelMaisGrave([])).toBeNull()
  })
})
