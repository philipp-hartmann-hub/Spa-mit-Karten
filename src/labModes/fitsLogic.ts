import { areaKm2, logRatioScore } from './geo'
import type { CountryFeature } from '../WorldMap'
import { normalizeId } from '../WorldMap'
import { FITS_REFERENCE_IDS } from './fitsReference'

export type FitsMetric = 'area' | 'population'

export function pickFitsPair(
  countries: CountryFeature[],
  metric: FitsMetric,
  popIndex: Record<string, number>,
  a2Of: (numericId: string) => string | undefined,
): { small: CountryFeature; big: CountryFeature; truth: number } | null {
  const byId = new Map(countries.map((c) => [normalizeId(c.id), c]))
  const refs = FITS_REFERENCE_IDS.map((id) => byId.get(id)).filter(Boolean) as CountryFeature[]
  if (refs.length === 0) return null

  for (let attempt = 0; attempt < 80; attempt++) {
    const small = refs[Math.floor(Math.random() * refs.length)]!
    const smallId = normalizeId(small.id)
    const smallVal =
      metric === 'area'
        ? areaKm2(small)
        : popIndex[a2Of(smallId) ?? ''] ?? 0
    if (!(smallVal > 0)) continue

    const candidates = countries.filter((c) => {
      const id = normalizeId(c.id)
      if (id === smallId) return false
      const v =
        metric === 'area' ? areaKm2(c) : popIndex[a2Of(id) ?? ''] ?? 0
      if (!(v > 0)) return false
      const r = v / smallVal
      return r >= 2 && r <= 60
    })
    if (candidates.length === 0) continue
    const big = candidates[Math.floor(Math.random() * candidates.length)]!
    const bigVal =
      metric === 'area'
        ? areaKm2(big)
        : popIndex[a2Of(normalizeId(big.id)) ?? ''] ?? 0
    return { small, big, truth: bigVal / smallVal }
  }
  return null
}

export function scoreFitsGuess(guess: number, truth: number): number {
  return logRatioScore(guess, truth)
}
