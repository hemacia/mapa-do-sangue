import { describe, expect, it } from 'vitest'
import { CONTAR_DOACOES_DO_MES, INSERIR_DOACAO, validarDoacao } from '../../../src/api/doacoes'
import { parseData } from '../../../src/domain/datas'
import { bancoComMigrations } from '../banco'

const HOJE = parseData('2026-11-10')

describe('validarDoacao', () => {
  it('aceita UF e tipo válidos e usa a data do servidor', () => {
    expect(validarDoacao({ uf: 'mg', tipo: 'O-', data: '1999-01-01' }, HOJE)).toEqual({
      uf: 'MG',
      tipo: 'O-',
      data: '2026-11-10',
    })
  })

  it('aceita doação sem tipo sanguíneo informado', () => {
    expect(validarDoacao({ uf: 'BA' }, HOJE)).toEqual({ uf: 'BA', tipo: null, data: '2026-11-10' })
  })

  it.each([
    [{ uf: 'XX' }, 'UF inválida'],
    [{ uf: 'SP', tipo: 'C+' }, 'Tipo sanguíneo inválido'],
    [null, 'UF inválida'],
    ['texto', 'UF inválida'],
  ])('rejeita %j', (corpo, mensagem) => {
    expect(() => validarDoacao(corpo, HOJE)).toThrow(mensagem)
  })
})

describe('consultas de doações', () => {
  it('grava a doação e conta as do mês', () => {
    const db = bancoComMigrations()
    db.prepare(INSERIR_DOACAO).run('MG', 'O-', '2026-11-10')
    db.prepare(INSERIR_DOACAO).run('BA', null, '2026-11-02')
    db.prepare(INSERIR_DOACAO).run('BA', null, '2026-10-31')

    const { total } = db.prepare(CONTAR_DOACOES_DO_MES).get('2026-11') as { total: number }

    expect(total).toBe(2)
  })
})
