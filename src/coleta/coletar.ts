import type { Fonte } from './fontes'
import type { ResultadoColeta } from './leituras'

export type Baixar = (url: string) => Promise<ArrayBuffer | Uint8Array>

export type ResultadoFonte =
  | ({ fonteId: string; ok: true } & ResultadoColeta)
  | { fonteId: string; ok: false; erro: string }

// Uma fonte fora do ar não pode impedir a coleta das outras.
export async function coletarTodas(fontes: Fonte[], baixar: Baixar, coletadoEm: Date): Promise<ResultadoFonte[]> {
  return Promise.all(
    fontes.map(async (fonte): Promise<ResultadoFonte> => {
      try {
        const texto = new TextDecoder(fonte.codificacao).decode(await baixar(fonte.url))
        return { fonteId: fonte.id, ok: true, ...fonte.ler(texto, coletadoEm) }
      } catch (erro) {
        return { fonteId: fonte.id, ok: false, erro: erro instanceof Error ? erro.message : String(erro) }
      }
    }),
  )
}

function texto(valor: string | null): string {
  return valor === null ? 'NULL' : `'${valor.replaceAll("'", "''")}'`
}

// SQL para `wrangler d1 execute --file`: o D1 não aceita parâmetros nesse modo,
// então todo valor passa por texto(), mesmo os que vêm do domínio.
export function gerarSQL(resultados: ResultadoFonte[], coletadoEm: Date): string {
  const quando = texto(coletadoEm.toISOString().replace(/\.\d{3}Z$/, 'Z'))
  const linhas: string[] = []
  for (const resultado of resultados) {
    if (!resultado.ok) continue
    const id = texto(resultado.fonteId)
    for (const { tipo, nivel } of resultado.leituras) {
      linhas.push(
        'INSERT INTO leituras_estoque (hemocentro_id, tipo, nivel, atualizado_na_fonte, coletado_em) ' +
          `VALUES (${id}, ${texto(tipo)}, ${texto(nivel)}, ${texto(resultado.atualizadoNaFonte)}, ${quando});`,
      )
    }
    linhas.push(`UPDATE fontes SET ultima_coleta_ok = ${quando} WHERE id = ${id};`)
  }
  return linhas.join('\n')
}
