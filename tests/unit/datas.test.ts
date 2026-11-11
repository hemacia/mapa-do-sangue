import { describe, expect, it } from 'vitest'
import { adicionarMeses, dataEmBrasilia, dataLocal, extrairDataBR, interpretarDataAmbigua, formatarData, formatarDataBR, idadeEmAnos, parseData } from '../../src/domain/datas'

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

describe('dataLocal', () => {
  it('usa o dia do relógio local e descarta a hora', () => {
    const agora = new Date(2026, 10, 10, 23, 30)

    expect(formatarData(dataLocal(agora))).toBe('2026-11-10')
  })
})

describe('interpretarDataAmbigua', () => {
  const coleta = parseData('2026-11-10')

  it('lê como dia/mês quando o primeiro número passa de 12', () => {
    expect(formatarData(interpretarDataAmbigua('29/03/2026', coleta))).toBe('2026-03-29')
  })

  it('lê como mês/dia quando o segundo número passa de 12', () => {
    expect(formatarData(interpretarDataAmbigua('03/29/2026', coleta))).toBe('2026-03-29')
  })

  it('escolhe a leitura mais próxima da coleta sem passar dela', () => {
    expect(formatarData(interpretarDataAmbigua('10/11/2026', coleta))).toBe('2026-11-10')
  })

  it('rejeita texto que não é data', () => {
    expect(() => interpretarDataAmbigua('ontem', coleta)).toThrow('Data inválida')
  })
})

describe('extrairDataBR', () => {
  it('extrai data e hora de um texto livre', () => {
    expect(extrairDataBR('Estoque de sangue REDE* - 10/11/2026 12:35')).toBe('2026-11-10T12:35')
  })

  it('extrai só a data quando não há hora', () => {
    expect(extrairDataBR('Última atualização: 05/11/2026')).toBe('2026-11-05')
  })

  it('devolve null quando o texto não tem data', () => {
    expect(extrairDataBR('Atualizado hoje')).toBeNull()
  })
})

describe('dataEmBrasilia', () => {
  it('usa o dia de Brasília mesmo quando em UTC já é o dia seguinte', () => {
    const agoraUTC = new Date('2026-11-11T01:12:00Z')

    expect(formatarData(dataEmBrasilia(agoraUTC))).toBe('2026-11-10')
  })

  it('vira o dia à meia-noite de Brasília, às 3h em UTC', () => {
    expect(formatarData(dataEmBrasilia(new Date('2026-11-11T03:00:00Z')))).toBe('2026-11-11')
  })
})
