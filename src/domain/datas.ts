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

export function formatarData(data: Date): string {
  return data.toISOString().slice(0, 10)
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
