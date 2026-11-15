import { describe, expect, it } from 'vitest'
import { montarPerfil, variacaoDasColetas } from '@/lib/domain/perfil'

const AP = {
  primeira_vez: 3356,
  repeticao: 12445,
  esporadico: 0,
  espontanea: 5829,
  reposicao: 9367,
  feminino: 6891,
  masculino: 8916,
  ate_29_anos: 5382,
  acima_29_anos: 10425,
  inaptos: 4115,
  'tipo_A+': 3662,
  'tipo_A-': 302,
  'tipo_AB+': 272,
  'tipo_AB-': 32,
  'tipo_B+': 1357,
  'tipo_B-': 115,
  'tipo_O+': 9091,
  'tipo_O-': 832,
}

describe('montarPerfil', () => {
  it('calcula os percentuais sobre os doadores aptos', () => {
    const perfil = montarPerfil(AP)

    expect(perfil).toMatchObject({
      doadores: 15801,
      primeiraVez: 21,
      repeticao: 79,
      reposicao: 62,
      feminino: 44,
      ate29: 34,
      inaptos: 21,
    })
    expect(perfil?.tipos?.find((t) => t.tipo === 'O+')?.percentual).toBe(58)
  })

  it('é nulo quando o estado mandou tudo zerado', () => {
    expect(montarPerfil({ primeira_vez: 0, repeticao: 0 })).toBeNull()
    expect(montarPerfil(undefined)).toBeNull()
  })

  it('esconde os tipos quando a tipagem cobre menos da metade dos doadores', () => {
    expect(montarPerfil({ ...AP, 'tipo_O+': 10, 'tipo_A+': 0, 'tipo_B+': 0 })?.tipos).toBeNull()
  })
})

describe('variacaoDasColetas', () => {
  it('compara os dois últimos anos', () => {
    const serie = [
      { ano: 2024, coletas: 111392, porMil: 26.9 },
      { ano: 2025, coletas: 48391, porMil: 11.6 },
    ]

    expect(variacaoDasColetas(serie)).toEqual({ de: 2024, para: 2025, percentual: -56.6 })
  })

  it('ignora ano com envio incompleto ou sem dado', () => {
    const serie = [
      { ano: 2024, coletas: 5182, porMil: 1.7 },
      { ano: 2025, coletas: 28240, porMil: 9.4 },
    ]

    expect(variacaoDasColetas(serie)).toBeNull()
    expect(variacaoDasColetas([{ ano: 2025, coletas: null, porMil: null }])).toBeNull()
  })
})
