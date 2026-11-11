import { URL_HEMOBA, lerHemoba } from './fontes/hemoba'
import { URL_HEMOES, lerHemoes } from './fontes/hemoes'
import { URL_HEMOMINAS, lerHemominas } from './fontes/hemominas'
import { URL_HEMOPI, lerHemopi } from './fontes/hemopi'
import { URL_HEMOSC, lerHemosc } from './fontes/hemosc'
import { URL_UNICAMP, lerUnicamp } from './fontes/unicamp'
import type { ResultadoColeta } from './leituras'

export interface Fonte {
  // Mesmo id do hemocentro em migrations/0002_fontes_iniciais.sql.
  id: string
  url: string
  codificacao: 'utf-8' | 'latin1'
  ler: (texto: string, coletadoEm: Date) => ResultadoColeta
}

export const FONTES: Fonte[] = [
  { id: 'hemoes', url: URL_HEMOES, codificacao: 'utf-8', ler: lerHemoes },
  { id: 'hemopi', url: URL_HEMOPI, codificacao: 'utf-8', ler: lerHemopi },
  { id: 'hemominas', url: URL_HEMOMINAS, codificacao: 'utf-8', ler: lerHemominas },
  { id: 'unicamp', url: URL_UNICAMP, codificacao: 'utf-8', ler: lerUnicamp },
  { id: 'hemosc', url: URL_HEMOSC, codificacao: 'latin1', ler: lerHemosc },
  { id: 'hemoba', url: URL_HEMOBA, codificacao: 'utf-8', ler: lerHemoba },
]
