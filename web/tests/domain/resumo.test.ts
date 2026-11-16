import { describe, expect, it } from 'vitest'
import type { EstatisticaUF } from '@/lib/api/cliente'
import { montarResumos } from '@/lib/domain/resumo'

const ESTATISTICAS: EstatisticaUF[] = [
  {
    uf: 'MG',
    ano: 2025,
    coletas: 336030,
    populacao: 21393441,
    porMil: 15.7,
    cobertura: 'completo',
    serie: [
      { ano: 2024, coletas: 346364, porMil: 16.2 },
      { ano: 2025, coletas: 336030, porMil: 15.7 },
    ],
    indicadores: { primeira_vez: 280, repeticao: 420, esporadico: 300 },
  },
  { uf: 'MA', ano: 2025, coletas: 0, populacao: 7018211, porMil: 0, cobertura: 'incompleto' },
]

describe('montarResumos', () => {
  const resumos = montarResumos(
    [
      { uf: 'MG', nivelGeral: 'critico', estoque: { 'O-': 'critico', 'A+': 'estavel' } },
      { uf: 'MG', nivelGeral: 'alerta', estoque: { 'O-': 'alerta', 'A+': 'critico' } },
    ],
    ESTATISTICAS,
  )

  it('junta os hemocentros do estado pelo pior nível de cada tipo', () => {
    expect(resumos.MG).toMatchObject({
      nome: 'Minas Gerais',
      hemocentros: 2,
      niveis: { 'O-': 'critico', 'A+': 'critico' },
      criticos: ['A+', 'O-'],
    })
  })

  it('traz a taxa, a posição, a variação e o percentual de primeira vez', () => {
    expect(resumos.MG).toMatchObject({ porMil: 15.7, ano: 2025, posicao: 1, total: 1, primeiraVez: 28 })
    expect(resumos.MG.variacao?.percentual).toBe(-3)
  })

  it('não mostra taxa de envio incompleto e cobre os 27 estados', () => {
    expect(resumos.MA).toMatchObject({ porMil: null, cobertura: 'incompleto', hemocentros: 0, criticos: [] })
    expect(Object.keys(resumos)).toHaveLength(27)
  })
})
