import { distanceKm, type LonLat } from './geo'

export type PopPoint = [lon: number, lat: number, pop: number]

const cache = new Map<string, PopPoint[]>()
let indexCache: Record<string, number> | null = null

export async function loadGrid(key: string | 'world'): Promise<PopPoint[]> {
  const k = key.toLowerCase()
  const hit = cache.get(k)
  if (hit) return hit
  const res = await fetch(`/popgrid/${k}.json`)
  if (!res.ok) {
    cache.set(k, [])
    return []
  }
  const data = (await res.json()) as PopPoint[]
  cache.set(k, data)
  return data
}

export async function loadPopIndex(): Promise<Record<string, number>> {
  if (indexCache) return indexCache
  const res = await fetch('/popgrid/index.json')
  if (!res.ok) {
    indexCache = {}
    return indexCache
  }
  indexCache = (await res.json()) as Record<string, number>
  return indexCache
}

export function sumInCircle(points: PopPoint[], center: LonLat, radiusKm: number): number {
  let sum = 0
  for (const [lon, lat, pop] of points) {
    if (distanceKm(center, [lon, lat]) <= radiusKm) sum += pop
  }
  return sum
}

/** Bevölkerungsgewichteter Schwerpunkt über 3D-Einheitsvektoren. */
export function weightedCentroid(points: PopPoint[]): LonLat | null {
  let x = 0
  let y = 0
  let z = 0
  let w = 0
  for (const [lon, lat, pop] of points) {
    if (!(pop > 0)) continue
    const φ = (lat * Math.PI) / 180
    const λ = (lon * Math.PI) / 180
    const cφ = Math.cos(φ)
    x += pop * cφ * Math.cos(λ)
    y += pop * cφ * Math.sin(λ)
    z += pop * Math.sin(φ)
    w += pop
  }
  if (!(w > 0)) return null
  x /= w
  y /= w
  z /= w
  const hyp = Math.hypot(x, y)
  const lon = (Math.atan2(y, x) * 180) / Math.PI
  const lat = (Math.atan2(z, hyp) * 180) / Math.PI
  return [lon, lat]
}

export function shareNorthOf(points: PopPoint[], lat: number): number {
  let north = 0
  let total = 0
  for (const [, plat, pop] of points) {
    total += pop
    if (plat >= lat) north += pop
  }
  if (!(total > 0)) return 0
  return north / total
}
