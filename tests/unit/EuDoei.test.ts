// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EuDoei from '../../src/components/EuDoei.vue'

function montar(registrar = vi.fn(async () => {}), totalDoMes = vi.fn(async () => 41)) {
  return mount(EuDoei, { props: { registrar, totalDoMes } })
}

describe('EuDoei', () => {
  it('mostra quantas doações foram registradas no mês', async () => {
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.get('[data-testid="total-mes"]').text()).toContain('41')
  })

  it('registra a doação com UF e tipo e soma no contador', async () => {
    const registrar = vi.fn(async () => {})
    const wrapper = montar(registrar)
    await flushPromises()

    await wrapper.get('select[name="uf"]').setValue('MG')
    await wrapper.get('select[name="tipo-doador"]').setValue('O-')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(registrar).toHaveBeenCalledWith('MG', 'O-')
    expect(wrapper.get('[role="status"]').text()).toContain('Obrigado')
    expect(wrapper.get('[data-testid="total-mes"]').text()).toContain('42')
  })

  it('envia tipo nulo quando a pessoa não informa', async () => {
    const registrar = vi.fn(async () => {})
    const wrapper = montar(registrar)

    await wrapper.get('select[name="uf"]').setValue('BA')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(registrar).toHaveBeenCalledWith('BA', null)
  })

  it('mostra o erro quando o registro falha', async () => {
    const wrapper = montar(vi.fn(async () => {
      throw new Error('UF inválida')
    }))

    await wrapper.get('select[name="uf"]').setValue('SP')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('UF inválida')
  })
})
