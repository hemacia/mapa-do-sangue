// Datas sem hora, sempre em UTC, para o fuso do navegador não trocar o dia.

const FORMATO_ISO = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseData(texto: string): Date {
  const partes = FORMATO_ISO.exec(texto)
  if (!partes) throw new Error(`Data inválida: ${texto}`)
  const [ano, mes, dia] = partes.slice(1).map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  if (data.getUTCMonth() !== mes - 1) throw new Error(`Data inválida: ${texto}`)
  return data
}

// Para "hoje" vale o dia que a pessoa vê no relógio, não o dia em UTC.
export function dataLocal(agora: Date): Date {
  return new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()))
}

// No servidor (Cloudflare) o relógio está em UTC: às 22h de Brasília já seria amanhã.
export function dataEmBrasilia(agora: Date): Date {
  const iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora)
  return parseData(iso)
}

export function formatarData(data: Date): string {
  return data.toISOString().slice(0, 10)
}

// O CSV do HEMOES mistura "29/03/2026" com "03/29/2026" na mesma coluna.
export function interpretarDataAmbigua(texto: string, coletadoEm: Date): Date {
  const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto.trim())
  if (!partes) throw new Error(`Data inválida: ${texto}`)
  const [a, b, ano] = partes.slice(1)
  const pad = (n: string) => n.padStart(2, '0')
  const candidatas = [`${ano}-${pad(b)}-${pad(a)}`, `${ano}-${pad(a)}-${pad(b)}`].flatMap((iso) => {
    try {
      return [parseData(iso)]
    } catch {
      return []
    }
  })
  if (candidatas.length === 0) throw new Error(`Data inválida: ${texto}`)
  const distancia = (d: Date) =>
    d > coletadoEm ? Number.MAX_SAFE_INTEGER : coletadoEm.getTime() - d.getTime()
  return candidatas.reduce((melhor, atual) => (distancia(atual) < distancia(melhor) ? atual : melhor))
}

// Devolve AAAA-MM-DD ou AAAA-MM-DDTHH:MM, no horário local da fonte.
export function extrairDataBR(texto: string): string | null {
  const partes = /(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}))?/.exec(texto)
  if (!partes) return null
  const [, dia, mes, ano, hora] = partes
  const data = formatarData(parseData(`${ano}-${mes}-${dia}`))
  return hora ? `${data}T${hora}` : data
}

export function formatarDataBR(data: Date): string {
  return formatarData(data).split('-').reverse().join('/')
}

export function adicionarMeses(data: Date, meses: number): Date {
  const ano = data.getUTCFullYear()
  const mes = data.getUTCMonth() + meses
  const ultimoDiaDoMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()
  return new Date(Date.UTC(ano, mes, Math.min(data.getUTCDate(), ultimoDiaDoMes)))
}

export function idadeEmAnos(nascimento: Date, em: Date): number {
  const anos = em.getUTCFullYear() - nascimento.getUTCFullYear()
  const mesAtual = em.getUTCMonth()
  const mesNascimento = nascimento.getUTCMonth()
  const aindaNaoFezAniversario =
    mesAtual < mesNascimento ||
    (mesAtual === mesNascimento && em.getUTCDate() < nascimento.getUTCDate())
  return aindaNaoFezAniversario ? anos - 1 : anos
}
