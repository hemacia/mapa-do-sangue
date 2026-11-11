import { describe, expect, it } from 'vitest'
import { adicionarMeses, formatarData, formatarDataBR, idadeEmAnos, parseData } from '../../src/domain/datas'

describe('parseData', () => {
  it('converte uma data ISO válida', () => {
    const data = parseData('2026-11-10')

    expect(formatarData(data)).toBe('2026-11-10')
  })

  it('rejeita texto fora do formato AAAA-MM-DD', () => {
    expect(() => parseData('10/11/2026')).toThrow('Data inválida')
  })

  it('rejeita dia que não existe no calendário', () => {
    expect(() => parseData('2026-02-30')).toThrow('Data inválida')
  })
})

describe('adicionarMeses', () => {
  it('soma meses mantendo o mesmo dia', () => {
    const resultado = adicionarMeses(parseData('2026-01-15'), 2)

    expect(formatarData(resultado)).toBe('2026-03-15')
  })

  it('usa o último dia do mês quando o dia não existe no destino', () => {
    const resultado = adicionarMeses(parseData('2026-12-31'), 2)

    expect(formatarData(resultado)).toBe('2027-02-28')
  })

  it('considera 29 de fevereiro em ano bissexto', () => {
    const resultado = adicionarMeses(parseData('2027-12-31'), 2)

    expect(formatarData(resultado)).toBe('2028-02-29')
  })

  it('subtrai meses com valor negativo', () => {
    const resultado = adicionarMeses(parseData('2026-03-31'), -12)

    expect(formatarData(resultado)).toBe('2025-03-31')
  })
})

describe('idadeEmAnos', () => {
  it('conta o ano só a partir do dia do aniversário', () => {
    const nascimento = parseData('2010-11-10')

    expect(idadeEmAnos(nascimento, parseData('2026-11-09'))).toBe(15)
    expect(idadeEmAnos(nascimento, parseData('2026-11-10'))).toBe(16)
  })

  it('trata quem nasceu em 29/02 como aniversariante em 01/03 nos anos não bissextos', () => {
    const nascimento = parseData('2008-02-29')

    expect(idadeEmAnos(nascimento, parseData('2026-02-28'))).toBe(17)
    expect(idadeEmAnos(nascimento, parseData('2026-03-01'))).toBe(18)
  })
})

describe('formatarDataBR', () => {
  it('formata no padrão dia/mês/ano', () => {
    expect(formatarDataBR(parseData('2027-02-05'))).toBe('05/02/2027')
  })
})
