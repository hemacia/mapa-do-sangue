import { describe, expect, it } from 'vitest'
import {
  doadoresDeHemacias,
  podeDoarHemacias,
  podeDoarPlasma,
  receptoresDeHemacias,
} from '../../src/domain/compatibilidade'

describe('podeDoarHemacias', () => {
  it('O- doa hemácias para qualquer tipo', () => {
    expect(receptoresDeHemacias('O-')).toHaveLength(8)
  })

  it('AB+ recebe hemácias de qualquer tipo', () => {
    expect(doadoresDeHemacias('AB+')).toHaveLength(8)
  })

  it('O- só recebe hemácias de O-', () => {
    expect(doadoresDeHemacias('O-')).toEqual(['O-'])
  })

  it('Rh+ não doa hemácias para Rh-', () => {
    expect(podeDoarHemacias('O+', 'A-')).toBe(false)
  })

  it('Rh- doa hemácias para Rh+ do mesmo grupo', () => {
    expect(podeDoarHemacias('A-', 'A+')).toBe(true)
  })

  it('A não doa hemácias para B', () => {
    expect(podeDoarHemacias('A+', 'B+')).toBe(false)
  })

  it('A+ doa hemácias apenas para A+ e AB+', () => {
    expect(receptoresDeHemacias('A+')).toEqual(['A+', 'AB+'])
  })

  it('B- recebe hemácias de B- e O-', () => {
    expect(doadoresDeHemacias('B-')).toEqual(['B-', 'O-'])
  })
})

describe('podeDoarPlasma', () => {
  it('AB doa plasma para qualquer grupo', () => {
    expect(podeDoarPlasma('AB-', 'O+')).toBe(true)
  })

  it('O só doa plasma para O', () => {
    expect(podeDoarPlasma('O+', 'A+')).toBe(false)
    expect(podeDoarPlasma('O+', 'O-')).toBe(true)
  })

  it('ignora o fator Rh no plasma', () => {
    expect(podeDoarPlasma('A+', 'A-')).toBe(true)
  })
})
