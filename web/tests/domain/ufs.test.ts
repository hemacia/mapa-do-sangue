import { describe, expect, it } from 'vitest'
import { doEstado, noEstado } from '@/lib/domain/ufs'

describe('noEstado e doEstado', () => {
  it.each([
    ['MG', 'em Minas Gerais', 'de Minas Gerais'],
    ['RJ', 'no Rio de Janeiro', 'do Rio de Janeiro'],
    ['BA', 'na Bahia', 'da Bahia'],
    ['SC', 'em Santa Catarina', 'de Santa Catarina'],
    ['ES', 'no Espírito Santo', 'do Espírito Santo'],
  ] as const)('%s vira "%s" e "%s"', (uf, em, de) => {
    expect(noEstado(uf)).toBe(em)
    expect(doEstado(uf)).toBe(de)
  })
})
