import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DoacoesBrasil } from '@/components/DoacoesBrasil'
import { DoacoesNoSite } from '@/components/DoacoesNoSite'
import type { EstatisticaUF } from '@/lib/api/cliente'

const ESTATISTICAS = [
  { uf: 'SP', ano: 2025, coletas: 730_000, populacao: 36_500_000, porMil: 20, cobertura: 'completo' },
  { uf: 'AC', ano: 2025, coletas: 3_650, populacao: 730_000, porMil: 5, cobertura: 'completo' },
] as EstatisticaUF[]

describe('DoacoesBrasil', () => {
  it('mostra a média por dia, o mínimo da OMS e os estados abaixo dele', () => {
    render(<DoacoesBrasil estatisticas={ESTATISTICAS} />)

    expect(screen.getByText(/bolsas por dia em 2025/)).toHaveTextContent('2.010 bolsas por dia')
    expect(screen.getByText(/Abaixo dele/)).toHaveTextContent(
      'Mínimo da OMS: 1.020 por dia. Abaixo dele: AC.',
    )
  })

  it('some sem estatística', () => {
    const { container } = render(<DoacoesBrasil estatisticas={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('DoacoesNoSite', () => {
  it('conta as doações registradas hoje e no mês', async () => {
    render(<DoacoesNoSite totalDoMes={async () => ({ mes: '2026-11', total: 12, hoje: 1 })} />)

    expect(await screen.findByText(/Neste site/)).toHaveTextContent('Neste site: 1 hoje, 12 no mês.')
  })
})
