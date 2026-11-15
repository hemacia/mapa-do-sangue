import type { AnoColetas } from '@/lib/api/cliente'
import { TIPOS_SANGUINEOS, type TipoSanguineo } from './tipos'

export interface Perfil {
  doadores: number
  primeiraVez: number // percentuais inteiros, sobre os doadores aptos
  repeticao: number
  esporadico: number
  espontanea: number
  reposicao: number
  feminino: number
  ate29: number
  inaptos: number // sobre todos os candidatos
  tipos: { tipo: TipoSanguineo; percentual: number }[] | null
}

const pct = (parte: number, todo: number) => (todo > 0 ? Math.round((parte / todo) * 100) : 0)

// Null quando o estado não mandou o perfil (MA manda tudo zerado). Os tipos só entram quando a
// tipagem cobre pelo menos metade dos doadores; senão a proporção não diz nada.
export function montarPerfil(indicadores: Record<string, number> | undefined): Perfil | null {
  const i = (nome: string) => indicadores?.[nome] ?? 0
  const doadores = i('primeira_vez') + i('repeticao') + i('esporadico')
  if (doadores === 0) return null
  const tipados = TIPOS_SANGUINEOS.reduce((soma, tipo) => soma + i(`tipo_${tipo}`), 0)
  return {
    doadores,
    primeiraVez: pct(i('primeira_vez'), doadores),
    repeticao: pct(i('repeticao'), doadores),
    esporadico: pct(i('esporadico'), doadores),
    espontanea: pct(i('espontanea'), i('espontanea') + i('reposicao')),
    reposicao: pct(i('reposicao'), i('espontanea') + i('reposicao')),
    feminino: pct(i('feminino'), i('feminino') + i('masculino')),
    ate29: pct(i('ate_29_anos'), i('ate_29_anos') + i('acima_29_anos')),
    inaptos: pct(i('inaptos'), doadores + i('inaptos')),
    tipos:
      tipados >= doadores / 2
        ? TIPOS_SANGUINEOS.map((tipo) => ({ tipo, percentual: pct(i(`tipo_${tipo}`), tipados) }))
        : null,
  }
}

export interface Variacao {
  de: number
  para: number
  percentual: number
}

// Compara os dois últimos anos com dado. Abaixo de 5 por mil o envio está incompleto e a comparação engana.
export function variacaoDasColetas(serie: AnoColetas[] | undefined): Variacao | null {
  const validos = (serie ?? []).filter((a) => a.coletas != null && a.porMil != null && a.porMil >= 5)
  if (validos.length < 2) return null
  const [anterior, atual] = validos.slice(-2)
  if (atual.ano !== anterior.ano + 1) return null
  const de = anterior.coletas as number
  const para = atual.coletas as number
  return { de: anterior.ano, para: atual.ano, percentual: Math.round(((para - de) / de) * 1000) / 10 }
}
