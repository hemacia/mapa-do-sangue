import { adicionarMeses, idadeEmAnos } from './datas'

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
