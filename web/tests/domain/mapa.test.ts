import { describe, expect, it } from 'vitest'
import { nivelPorUF } from '@/lib/domain/mapa'

describe('nível de cada estado no mapa', () => {
  it('usa o nível geral mais grave entre os hemocentros do estado', () => {
    const hemocentros = [
      { uf: 'SP', nivelGeral: 'estavel' as const },
      { uf: 'SP', nivelGeral: 'critico' as const },
      { uf: 'MG', nivelGeral: 'adequado' as const },
    ]

    const niveis = nivelPorUF(hemocentros)

    expect(niveis.SP).toBe('critico')
    expect(niveis.MG).toBe('adequado')
  })

  it('deixa sem nível o estado que não publica o estoque', () => {
    const niveis = nivelPorUF([{ uf: 'MG', nivelGeral: 'alerta' as const }])

    expect(niveis.RJ).toBeNull()
    expect(Object.keys(niveis)).toHaveLength(27)
  })

  it('ignora UF que não existe', () => {
    const niveis = nivelPorUF([{ uf: 'XX', nivelGeral: 'critico' as const }])

    expect(Object.values(niveis).every((nivel) => nivel === null)).toBe(true)
  })
})

describe('nível de um tipo sanguíneo em cada estado', () => {
  it('usa o nível mais grave daquele tipo entre os hemocentros do estado', () => {
    const hemocentros = [
      {
        uf: 'SP',
        nivelGeral: 'critico' as const,
        estoque: { 'A+': 'adequado' as const, 'O-': 'critico' as const },
      },
      { uf: 'SP', nivelGeral: 'alerta' as const, estoque: { 'A+': 'estavel' as const } },
    ]

    const niveis = nivelPorUF(hemocentros, 'A+')

    expect(niveis.SP).toBe('estavel')
  })

  it('deixa sem nível o estado cujos hemocentros não informam o tipo', () => {
    const hemocentros = [{ uf: 'SP', nivelGeral: 'critico' as const, estoque: { 'O-': 'critico' as const } }]

    const niveis = nivelPorUF(hemocentros, 'A+')

    expect(niveis.SP).toBeNull()
  })
})
