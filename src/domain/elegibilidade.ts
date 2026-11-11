import { adicionarMeses, formatarDataBR, idadeEmAnos } from './datas'

// Regras do Anexo IV-B da Portaria GM/MS 11.685/2026 (em vigor desde 30/09/2026).

export type Sexo = 'masculino' | 'feminino'

export type Avaliacao = 'apto' | 'apto_com_consentimento' | 'apto_com_avaliacao_medica' | 'inapto'

const REGRAS_POR_SEXO: Record<Sexo, { intervaloMeses: number; limiteEm12Meses: number }> = {
  masculino: { intervaloMeses: 2, limiteEm12Meses: 4 }, // art. 38
  feminino: { intervaloMeses: 3, limiteEm12Meses: 3 },
}

// Art. 39: 16 anos completos até 69a11m29d; primeira doação até 60a11m29d;
// doador de repetição com 70+ continua após avaliação médica (§5º).
export function avaliarIdade(nascimento: Date, hoje: Date, jaDoou: boolean): Avaliacao {
  if (nascimento > hoje) throw new Error('Data de nascimento no futuro')
  const idade = idadeEmAnos(nascimento, hoje)
  if (idade < 16) return 'inapto'
  if (idade < 18) return 'apto_com_consentimento'
  if (!jaDoou && idade > 60) return 'inapto'
  if (idade >= 70) return 'apto_com_avaliacao_medica'
  return 'apto'
}

// Art. 40: mínimo de 50 kg; abaixo disso só com avaliação médica.
export function avaliarPeso(kg: number): Avaliacao {
  if (!(kg > 0)) throw new Error(`Peso inválido: ${kg}`)
  return kg >= 50 ? 'apto' : 'apto_com_avaliacao_medica'
}

// Art. 38: intervalo em meses e limite numa janela móvel de 12 meses.
// A doação sai da janela exatamente 12 meses depois.
export function proximaDataApta(doacoes: Date[], sexo: Sexo): Date | null {
  if (doacoes.length === 0) return null
  const { intervaloMeses, limiteEm12Meses } = REGRAS_POR_SEXO[sexo]
  const recentes = [...doacoes].sort((a, b) => b.getTime() - a.getTime())

  const aposIntervalo = adicionarMeses(recentes[0], intervaloMeses)
  if (recentes.length < limiteEm12Meses) return aposIntervalo

  const aposSairDaJanela = adicionarMeses(recentes[limiteEm12Meses - 1], 12)
  return aposSairDaJanela > aposIntervalo ? aposSairDaJanela : aposIntervalo
}

export interface Candidato {
  nascimento: Date
  sexo: Sexo
  pesoKg: number
  doacoes: Date[]
}

export interface ResultadoAvaliacao {
  podeDoarHoje: boolean
  mensagens: string[]
  proximaData: Date | null
}

const MENSAGENS_IDADE: Partial<Record<Avaliacao, string>> = {
  inapto: 'Pela idade você ainda não pode doar (de 16 a 69 anos, primeira doação até os 60)',
  apto_com_consentimento: 'Menores de 18 anos precisam de autorização por escrito do responsável',
  apto_com_avaliacao_medica: 'A partir de 70 anos a doação depende de avaliação médica no hemocentro',
}

export function avaliarCandidato(candidato: Candidato, hoje: Date): ResultadoAvaliacao {
  const idade = avaliarIdade(candidato.nascimento, hoje, candidato.doacoes.length > 0)
  const mensagens: string[] = []
  if (MENSAGENS_IDADE[idade]) mensagens.push(MENSAGENS_IDADE[idade])
  if (avaliarPeso(candidato.pesoKg) !== 'apto') {
    mensagens.push('Abaixo de 50 kg a doação depende de avaliação médica no hemocentro')
  }

  const proximaData = proximaDataApta(candidato.doacoes, candidato.sexo)
  const aguardando = proximaData !== null && proximaData > hoje
  if (aguardando) mensagens.push(`Você poderá doar de novo a partir de ${formatarDataBR(proximaData)}`)

  return { podeDoarHoje: idade !== 'inapto' && !aguardando, mensagens, proximaData }
}
