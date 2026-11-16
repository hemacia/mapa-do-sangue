import type { EstatisticaUF } from '@/lib/api/cliente'
import { posicaoNoRanking } from './estatisticas'
import { nivelPorUF } from './mapa'
import type { NivelEstoque } from './nivel'
import { montarPerfil, type Variacao, variacaoDasColetas } from './perfil'
import { TIPOS_SANGUINEOS, type TipoSanguineo } from './tipos'
import { NOMES_UF, type UF, UFS } from './ufs'

interface ComEstoque {
  uf: string
  nivelGeral: NivelEstoque
  estoque: Partial<Record<TipoSanguineo, NivelEstoque>>
}

// O que o painel do mapa mostra ao clicar num estado, sem sair da página.
export interface ResumoEstado {
  uf: UF
  nome: string
  hemocentros: number
  niveis: Partial<Record<TipoSanguineo, NivelEstoque>> // o pior nível de cada tipo entre os hemocentros
  criticos: TipoSanguineo[]
  porMil: number | null
  cobertura: EstatisticaUF['cobertura'] | null
  ano: number | null
  posicao: number | null
  total: number | null
  variacao: Variacao | null
  primeiraVez: number | null
}

export function montarResumos(
  hemocentros: ComEstoque[],
  estatisticas: EstatisticaUF[],
): Record<UF, ResumoEstado> {
  const niveisPorTipo = Object.fromEntries(
    TIPOS_SANGUINEOS.map((tipo) => [tipo, nivelPorUF(hemocentros, tipo)]),
  )
  return Object.fromEntries(
    UFS.map((uf) => {
      const estatistica = estatisticas.find((e) => e.uf === uf)
      const posicao = posicaoNoRanking(estatisticas, uf)
      const niveis: ResumoEstado['niveis'] = {}
      for (const tipo of TIPOS_SANGUINEOS) {
        const nivel = niveisPorTipo[tipo][uf]
        if (nivel) niveis[tipo] = nivel
      }
      const resumo: ResumoEstado = {
        uf,
        nome: NOMES_UF[uf],
        hemocentros: hemocentros.filter((h) => h.uf === uf).length,
        niveis,
        criticos: TIPOS_SANGUINEOS.filter((tipo) => niveis[tipo] === 'critico'),
        porMil: estatistica?.cobertura === 'completo' ? (estatistica.porMil ?? null) : null,
        cobertura: estatistica?.cobertura ?? null,
        ano: estatistica?.ano ?? null,
        posicao: posicao?.posicao ?? null,
        total: posicao?.total ?? null,
        variacao: variacaoDasColetas(estatistica?.serie),
        primeiraVez: montarPerfil(estatistica?.indicadores)?.primeiraVez ?? null,
      }
      return [uf, resumo]
    }),
  ) as Record<UF, ResumoEstado>
}
