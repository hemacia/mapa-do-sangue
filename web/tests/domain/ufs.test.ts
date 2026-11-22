import { describe, expect, it } from 'vitest'
import { CAPITAIS, doEstado, noEstado, siglaDaUF, UFS } from '@/lib/domain/ufs'

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

  it.each([
    ['AC', 'no Acre'],
    ['AL', 'em Alagoas'],
    ['AM', 'no Amazonas'],
    ['AP', 'no Amapá'],
    ['CE', 'no Ceará'],
    ['DF', 'no Distrito Federal'],
    ['GO', 'em Goiás'],
    ['MA', 'no Maranhão'],
    ['MS', 'em Mato Grosso do Sul'],
    ['MT', 'em Mato Grosso'],
    ['PA', 'no Pará'],
    ['PB', 'na Paraíba'],
    ['PE', 'em Pernambuco'],
    ['PI', 'no Piauí'],
    ['PR', 'no Paraná'],
    ['RN', 'no Rio Grande do Norte'],
    ['RO', 'em Rondônia'],
    ['RR', 'em Roraima'],
    ['RS', 'no Rio Grande do Sul'],
    ['SE', 'em Sergipe'],
    ['SP', 'em São Paulo'],
    ['TO', 'no Tocantins'],
  ] as const)('usa o artigo certo para %s: "%s"', (uf, em) => {
    expect(noEstado(uf)).toBe(em)
  })
})

describe('siglaDaUF', () => {
  it('ignora espaços em volta do nome', () => {
    expect(siglaDaUF('  Bahia ')).toBe('BA')
  })
})

describe('CAPITAIS', () => {
  it('tem uma capital, com nome, para cada um dos 27 estados', () => {
    const capitais = UFS.map((uf) => CAPITAIS[uf])

    expect(capitais).toHaveLength(27)
    expect(capitais.every((nome) => nome.length > 0)).toBe(true)
    expect(new Set(capitais).size).toBe(27)
  })
})
