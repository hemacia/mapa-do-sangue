import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Legenda } from '@/components/Legenda'
import { MapaBrasil } from '@/components/MapaBrasil'
import { nivelPorUF } from '@/lib/domain/mapa'

const HEMOCENTROS = [
  { uf: 'MG', nivelGeral: 'critico' as const, estoque: { 'A+': 'adequado' as const } },
  { uf: 'BA', nivelGeral: 'alerta' as const, estoque: {} },
]
const CAMADAS = [
  { rotulo: 'Pior nível', niveis: nivelPorUF(HEMOCENTROS) },
  { rotulo: 'A+', niveis: nivelPorUF(HEMOCENTROS, 'A+') },
]

describe('MapaBrasil', () => {
  it('tem um link para a página de cada um dos 27 estados', () => {
    render(<MapaBrasil camadas={CAMADAS} />)

    expect(screen.getAllByRole('link')).toHaveLength(27)
    expect(screen.getByRole('link', { name: 'Minas Gerais: pior nível crítico' })).toHaveAttribute(
      'href',
      '/estado/mg',
    )
    expect(screen.getByRole('link', { name: 'Rio de Janeiro: não publica o estoque' })).toHaveAttribute(
      'href',
      '/estado/rj',
    )
  })

  it('guarda a cor de cada camada no estado, e cinza quando não há dado', () => {
    render(<MapaBrasil camadas={CAMADAS} />)

    const minas = screen.getByRole('link', { name: /^Minas Gerais/ })
    expect(minas.style.getPropertyValue('--f0')).toBe('var(--critico)')
    expect(minas.style.getPropertyValue('--f1')).toBe('var(--adequado)')
    const bahia = screen.getByRole('link', { name: /^Bahia/ })
    expect(bahia.style.getPropertyValue('--f1')).toBe('var(--sem-dado)')
  })

  it('começa mostrando a camada do pior nível', () => {
    render(<MapaBrasil camadas={CAMADAS} />)

    expect(screen.getByRole('radio', { name: 'Pior nível' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'A+' })).not.toBeChecked()
  })
})

describe('Legenda', () => {
  it('lista os quatro níveis e o estado sem dado', () => {
    render(<Legenda />)

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Crítico',
      'Alerta',
      'Estável',
      'Adequado',
      'Não publica o estoque',
    ])
  })
})
