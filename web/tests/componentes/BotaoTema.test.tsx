import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BotaoTema } from '@/components/BotaoTema'

function preferirTemaClaro(claro: boolean) {
  vi.stubGlobal('matchMedia', (consulta: string) => ({ matches: claro && consulta.includes('light') }))
}

describe('BotaoTema', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme
    localStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('troca do tema escuro do sistema para o claro e salva a escolha', async () => {
    preferirTemaClaro(false)
    render(<BotaoTema />)

    await userEvent.click(screen.getByRole('button', { name: 'Usar tema claro' }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('tema')).toBe('light')
    expect(screen.getByRole('button', { name: 'Usar tema escuro' })).toBeInTheDocument()
  })

  it('respeita o tema já salvo', async () => {
    preferirTemaClaro(false)
    document.documentElement.dataset.theme = 'light'
    render(<BotaoTema />)

    await userEvent.click(screen.getByRole('button', { name: 'Usar tema escuro' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
