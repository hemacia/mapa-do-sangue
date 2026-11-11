// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PossoDoar from '../../src/components/PossoDoar.vue'
import { parseData } from '../../src/domain/datas'

const HOJE = parseData('2026-11-10')

async function preencher(campos: { nascimento: string; peso: string; ultimaDoacao?: string }) {
  const wrapper = mount(PossoDoar, { props: { hoje: HOJE } })
  await wrapper.get('[name="nascimento"]').setValue(campos.nascimento)
  await wrapper.get('[name="peso"]').setValue(campos.peso)
  await wrapper.get('[name="ultima-doacao"]').setValue(campos.ultimaDoacao ?? '')
  await wrapper.get('form').trigger('submit')
  return wrapper
}

describe('PossoDoar', () => {
  it('mostra que um adulto saudável pode doar hoje', async () => {
    const wrapper = await preencher({ nascimento: '1995-05-20', peso: '70' })

    expect(wrapper.get('[role="status"]').text()).toContain('Você pode doar hoje')
  })

  it('mostra a próxima data para quem doou há pouco', async () => {
    const wrapper = await preencher({ nascimento: '1995-05-20', peso: '70', ultimaDoacao: '2026-10-01' })

    const status = wrapper.get('[role="status"]').text()
    expect(status).toContain('Hoje você ainda não pode doar')
    expect(status).toContain('01/01/2027')
  })

  it('mostra erro quando o peso é inválido', async () => {
    const wrapper = await preencher({ nascimento: '1995-05-20', peso: '0' })

    expect(wrapper.get('[role="alert"]').text()).toContain('Confira')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })
})
