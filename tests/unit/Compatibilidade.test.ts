// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Compatibilidade from '../../src/components/Compatibilidade.vue'

describe('Compatibilidade', () => {
  it('mostra para quem e de quem o tipo escolhido doa e recebe', async () => {
    const wrapper = mount(Compatibilidade)

    await wrapper.get('select').setValue('A+')

    expect(wrapper.get('[data-testid="doa-para"]').text()).toBe('A+, AB+')
    expect(wrapper.get('[data-testid="recebe-de"]').text()).toBe('A+, A-, O+, O-')
  })

  it('começa com O- selecionado, o doador universal', () => {
    const wrapper = mount(Compatibilidade)

    expect(wrapper.get('[data-testid="doa-para"]').text().split(', ')).toHaveLength(8)
  })
})
