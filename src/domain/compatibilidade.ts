import { TIPOS_SANGUINEOS, type TipoSanguineo } from './tipos'

// Portaria GM/MS 11.685/2026, Anexo IV-B, art. 185: hemácias ABO compatíveis,
// receptor Rh- recebe só Rh-, plasma compatível com as hemácias do receptor.

function antigenos(tipo: TipoSanguineo): string[] {
  const grupo = tipo.slice(0, -1)
  return grupo === 'O' ? [] : grupo.split('')
}

function rhPositivo(tipo: TipoSanguineo): boolean {
  return tipo.endsWith('+')
}

function contemTodos(de: string[], em: string[]): boolean {
  return de.every((antigeno) => em.includes(antigeno))
}

export function podeDoarHemacias(doador: TipoSanguineo, receptor: TipoSanguineo): boolean {
  if (rhPositivo(doador) && !rhPositivo(receptor)) return false
  return contemTodos(antigenos(doador), antigenos(receptor))
}

// No plasma vão os anticorpos: o doador não pode ter anticorpo contra antígeno do receptor.
export function podeDoarPlasma(doador: TipoSanguineo, receptor: TipoSanguineo): boolean {
  return contemTodos(antigenos(receptor), antigenos(doador))
}

export function receptoresDeHemacias(doador: TipoSanguineo): TipoSanguineo[] {
  return TIPOS_SANGUINEOS.filter((receptor) => podeDoarHemacias(doador, receptor))
}

export function doadoresDeHemacias(receptor: TipoSanguineo): TipoSanguineo[] {
  return TIPOS_SANGUINEOS.filter((doador) => podeDoarHemacias(doador, receptor))
}
