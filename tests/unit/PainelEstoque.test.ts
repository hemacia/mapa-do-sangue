// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { EstoqueHemocentro } from '../../src/api/estoque'
import PainelEstoque from '../../src/components/PainelEstoque.vue'

function hemocentro(id: string, uf: string, estoque: EstoqueHemocentro['estoque']): EstoqueHemocentro {
  return {
    id, nome: id.toUpperCase(), uf, cidade: 'Cidade', latitude: 0, longitude: 0,
    nivelGeral: 'critico', estoque, atualizadoNaFonte: '2026-11-10', coletadoEm: '2026-11-10T12:00:00Z',
  }
}

const DADOS = [
  hemocentro('hemoes', 'ES', { 'O-': 'critico', 'A+': 'estavel' }),
  hemocentro('hemopi', 'PI', { 'O-': 'alerta', 'A+': 'adequado' }),
]

async function montar(carregar: () => Promise<EstoqueHemocentro[]> = async () => DADOS) {
  const wrapper = mount(PainelEstoque, { props: { carregar }, global: { stubs: { MapaEstoque: true } } })
  await flushPromises()
  return wrapper
}

describe('PainelEstoque', () => {
  it('lista os hemocentros com o nível do tipo O- por padrão', async () => {
    const wrapper = await montar()

    const linhas = wrapper.findAll('tbody tr').map((linha) => linha.text())
    expect(linhas[0]).toContain('HEMOES')
    expect(linhas[0]).toContain('Crítico')
    expect(linhas[1]).toContain('Alerta')
  })

  it('troca o nível exibido ao escolher outro tipo', async () => {
    const wrapper = await montar()

    await wrapper.get('select[name="tipo-estoque"]').setValue('A+')

    expect(wrapper.findAll('tbody tr')[1].text()).toContain('Adequado')
  })

  it('resume quantos hemocentros estão críticos no tipo escolhido', async () => {
    const wrapper = await montar()

    expect(wrapper.get('[data-testid="resumo"]').text()).toBe('O- está crítico em 1 de 2 hemocentros')
  })

  it('mostra "sem dado" quando o hemocentro não informa o tipo', async () => {
    const wrapper = await montar(async () => [hemocentro('hemoba', 'BA', { 'A+': 'estavel' })])

    expect(wrapper.get('tbody tr').text()).toContain('Sem dado')
  })

  it('mostra erro quando não consegue carregar', async () => {
    const wrapper = await montar(async () => {
      throw new Error('Não foi possível carregar o estoque')
    })

    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível carregar o estoque')
  })
})
