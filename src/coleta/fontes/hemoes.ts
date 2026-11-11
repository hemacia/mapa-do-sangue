import { formatarData, interpretarDataAmbigua } from '../../domain/datas'
import { normalizarNivel } from '../../domain/nivel'
import { TIPOS_SANGUINEOS } from '../../domain/tipos'
import { type Leitura, type ResultadoColeta, validarLeituras } from '../leituras'

// API CKAN do portal de dados abertos do ES: um registro por dia, uma coluna por tipo.
export const URL_HEMOES =
  'https://dados.es.gov.br/api/3/action/datastore_search?resource_id=d73f9335-f454-4d1a-bfba-51ed2dac9cb6&sort=_id%20desc&limit=1'

export function lerHemoes(texto: string, coletadoEm: Date): ResultadoColeta {
  const registro = JSON.parse(texto)?.result?.records?.[0]
  if (!registro) throw new Error('HEMOES: API não devolveu nenhum registro')

  const leituras: Leitura[] = TIPOS_SANGUINEOS.flatMap((tipo) => {
    const nivel = normalizarNivel(String(registro[tipo] ?? ''))
    return nivel ? [{ tipo, nivel }] : []
  })

  return {
    leituras: validarLeituras('HEMOES', leituras),
    atualizadoNaFonte: formatarData(interpretarDataAmbigua(registro.Data, coletadoEm)),
  }
}
