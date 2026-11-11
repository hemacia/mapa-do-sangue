import { describe, expect, it } from 'vitest'
import { validarLeituras } from '../../src/coleta/leituras'

describe('validarLeituras', () => {
  it('aceita leituras com tipos diferentes', () => {
    const leituras = [
      { tipo: 'O-' as const, nivel: 'critico' as const },
      { tipo: 'A+' as const, nivel: 'estavel' as const },
    ]

    expect(validarLeituras('teste', leituras)).toBe(leituras)
  })

  it('falha quando a fonte não trouxe nenhuma leitura', () => {
    expect(() => validarLeituras('teste', [])).toThrow('teste: nenhuma leitura')
  })

  it('falha quando o mesmo tipo aparece duas vezes', () => {
    const repetidas = [
      { tipo: 'O-' as const, nivel: 'critico' as const },
      { tipo: 'O-' as const, nivel: 'alerta' as const },
    ]

    expect(() => validarLeituras('teste', repetidas)).toThrow('teste: tipo O- repetido')
  })
})
