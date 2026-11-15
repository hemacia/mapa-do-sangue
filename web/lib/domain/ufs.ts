export const NOMES_UF = {
  AC: 'Acre',
  AL: 'Alagoas',
  AM: 'Amazonas',
  AP: 'Amapá',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  PA: 'Pará',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  PI: 'Piauí',
  PR: 'Paraná',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RO: 'Rondônia',
  RR: 'Roraima',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  SE: 'Sergipe',
  SP: 'São Paulo',
  TO: 'Tocantins',
} as const

export type UF = keyof typeof NOMES_UF

export const UFS = Object.keys(NOMES_UF) as UF[]

export function siglaDaUF(nome: string): UF | null {
  const procurado = nome.trim().toLowerCase()
  return UFS.find((uf) => NOMES_UF[uf].toLowerCase() === procurado) ?? null
}

// "em Minas Gerais", "no Rio de Janeiro", "na Bahia": cada estado tem seu artigo.
const ARTIGO: Partial<Record<UF, 'no' | 'na'>> = {
  AC: 'no',
  AP: 'no',
  AM: 'no',
  BA: 'na',
  CE: 'no',
  DF: 'no',
  ES: 'no',
  MA: 'no',
  PA: 'no',
  PB: 'na',
  PR: 'no',
  PI: 'no',
  RJ: 'no',
  RN: 'no',
  RS: 'no',
  TO: 'no',
}

export function noEstado(uf: UF): string {
  return `${ARTIGO[uf] ?? 'em'} ${NOMES_UF[uf]}`
}

export function doEstado(uf: UF): string {
  const artigo = ARTIGO[uf]
  return `${artigo === 'na' ? 'da' : artigo === 'no' ? 'do' : 'de'} ${NOMES_UF[uf]}`
}

// Nome como o IBGE escreve, para casar com a cidade do CNES.
export const CAPITAIS: Record<UF, string> = {
  AC: 'Rio Branco',
  AL: 'Maceió',
  AM: 'Manaus',
  AP: 'Macapá',
  BA: 'Salvador',
  CE: 'Fortaleza',
  DF: 'Brasília',
  ES: 'Vitória',
  GO: 'Goiânia',
  MA: 'São Luís',
  MG: 'Belo Horizonte',
  MS: 'Campo Grande',
  MT: 'Cuiabá',
  PA: 'Belém',
  PB: 'João Pessoa',
  PE: 'Recife',
  PI: 'Teresina',
  PR: 'Curitiba',
  RJ: 'Rio de Janeiro',
  RN: 'Natal',
  RO: 'Porto Velho',
  RR: 'Boa Vista',
  RS: 'Porto Alegre',
  SC: 'Florianópolis',
  SE: 'Aracaju',
  SP: 'São Paulo',
  TO: 'Palmas',
}
