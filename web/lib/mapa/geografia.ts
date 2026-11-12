import { geoMercator, geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type { UF } from '@/lib/domain/ufs'
import malha from './ufs.geo.json'

// Malha das UFs do IBGE (API de malhas v3, qualidade mínima), com o código IBGE em codarea.
const UF_POR_CODIGO: Record<string, UF> = {
  '11': 'RO',
  '12': 'AC',
  '13': 'AM',
  '14': 'RR',
  '15': 'PA',
  '16': 'AP',
  '17': 'TO',
  '21': 'MA',
  '22': 'PI',
  '23': 'CE',
  '24': 'RN',
  '25': 'PB',
  '26': 'PE',
  '27': 'AL',
  '28': 'SE',
  '29': 'BA',
  '31': 'MG',
  '32': 'ES',
  '33': 'RJ',
  '35': 'SP',
  '41': 'PR',
  '42': 'SC',
  '43': 'RS',
  '50': 'MS',
  '51': 'MT',
  '52': 'GO',
  '53': 'DF',
}

export interface EstadoDesenhado {
  uf: UF
  d: string
  centro: [number, number]
  area: number
}

// O GeoJSON do IBGE segue a RFC 7946 (anel externo anti-horário); o d3-geo espera o contrário,
// e sem inverter cada estado vira "o mundo menos o estado".
function inverterAneis(feature: Feature<Polygon | MultiPolygon, { codarea: string }>) {
  const geometry = feature.geometry
  const coordinates =
    geometry.type === 'Polygon'
      ? geometry.coordinates.map((anel) => [...anel].reverse())
      : geometry.coordinates.map((poligono) => poligono.map((anel) => [...anel].reverse()))
  return { ...feature, geometry: { ...geometry, coordinates } } as typeof feature
}

// Roda no servidor: o navegador recebe só o SVG pronto, sem a malha nem o d3.
export function desenharEstados(largura: number, altura: number): EstadoDesenhado[] {
  const original = malha as FeatureCollection<Polygon | MultiPolygon, { codarea: string }>
  const colecao = { ...original, features: original.features.map(inverterAneis) }
  const projecao = geoMercator().fitSize([largura, altura], colecao)
  const caminho = geoPath(projecao)
  return colecao.features.map((feature) => ({
    uf: UF_POR_CODIGO[feature.properties.codarea],
    d: caminho(feature) ?? '',
    centro: caminho.centroid(feature),
    area: caminho.area(feature),
  }))
}
