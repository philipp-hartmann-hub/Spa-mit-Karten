import { alpha2Of } from './isoAlpha2'
import { REGION_FLAG_EXT } from './regionFlagExts'

const FLAG_BASE =
  'https://cdn.jsdelivr.net/gh/amckenna41/iso3166-flags@main'

export function countryFlagUrl(numericId: string): string | null {
  const a2 = alpha2Of(numericId)?.toLowerCase()
  if (!a2) return null
  return `${FLAG_BASE}/iso3166-1-flags/${a2}.svg`
}

export function regionFlagUrl(regionId: string): string | null {
  const ext = REGION_FLAG_EXT[regionId]
  if (!ext) return null
  const country = regionId.slice(0, regionId.indexOf('-'))
  return `${FLAG_BASE}/iso3166-2-flags/${country}/${regionId}.${ext}`
}

export function hasRegionFlag(regionId: string): boolean {
  return regionId in REGION_FLAG_EXT
}

export function hasCountryFlag(numericId: string): boolean {
  return alpha2Of(numericId) !== null
}
