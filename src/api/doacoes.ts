import { formatarData } from '../domain/datas'
import { TIPOS_SANGUINEOS, type TipoSanguineo } from '../domain/tipos'
import { UFS, type UF } from '../domain/ufs'

export const INSERIR_DOACAO = 'INSERT INTO doacoes_registradas (uf, tipo, data) VALUES (?, ?, ?)'

// Recebe o mês como AAAA-MM.
export const CONTAR_DOACOES_DO_MES =
  "SELECT count(*) AS total FROM doacoes_registradas WHERE substr(data, 1, 7) = ?"

export interface Doacao {
  uf: UF
  tipo: TipoSanguineo | null
  data: string
}

// Corpo vem do navegador: nada é confiável, e a data é sempre a do servidor.
export function validarDoacao(corpo: unknown, hoje: Date): Doacao {
  const dados = (typeof corpo === 'object' && corpo !== null ? corpo : {}) as Record<string, unknown>
  const uf = String(dados.uf ?? '').toUpperCase()
  if (!UFS.includes(uf as UF)) throw new Error('UF inválida')
  const tipo = dados.tipo ?? null
  if (tipo !== null && !TIPOS_SANGUINEOS.includes(tipo as TipoSanguineo)) {
    throw new Error('Tipo sanguíneo inválido')
  }
  return { uf: uf as UF, tipo: tipo as TipoSanguineo | null, data: formatarData(hoje) }
}
