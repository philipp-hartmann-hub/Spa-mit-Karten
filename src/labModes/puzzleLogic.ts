import { geoCentroid } from 'd3-geo'
import type { CountryFeature } from '../WorldMap'
import { normalizeId } from '../WorldMap'
import { areaKm2, distanceKm, type LonLat } from './geo'

export const PUZZLE_AUTO_AREA_KM2 = 2000

export function isAutoPlaced(feature: CountryFeature): boolean {
  return areaKm2(feature) < PUZZLE_AUTO_AREA_KM2
}

/** Kleine Länder = großzügigere Toleranz (km). */
export function snapToleranceKm(feature: CountryFeature): number {
  const a = Math.max(500, areaKm2(feature))
  return Math.min(450, 80 + 12000 / Math.sqrt(a))
}

export function canSnap(placed: LonLat, feature: CountryFeature): boolean {
  const truth = geoCentroid(feature) as LonLat
  return distanceKm(placed, truth) <= snapToleranceKm(feature)
}

export function shuffle<T>(items: T[], seed = Math.random()): T[] {
  const arr = [...items]
  let s = seed
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

export function bestTimeKey(continent: string): string {
  return `lab-puzzle-best:${continent}`
}

export function readBestTime(continent: string): number | null {
  try {
    const v = localStorage.getItem(bestTimeKey(continent))
    if (!v) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function writeBestTime(continent: string, ms: number): void {
  try {
    const prev = readBestTime(continent)
    if (prev === null || ms < prev) localStorage.setItem(bestTimeKey(continent), String(ms))
  } catch {
    /* private mode */
  }
}

export function playablePuzzlePieces(countries: CountryFeature[]): {
  auto: CountryFeature[]
  tray: CountryFeature[]
} {
  const auto: CountryFeature[] = []
  const tray: CountryFeature[] = []
  for (const c of countries) {
    if (!normalizeId(c.id)) continue
    if (isAutoPlaced(c)) auto.push(c)
    else tray.push(c)
  }
  return { auto, tray }
}
