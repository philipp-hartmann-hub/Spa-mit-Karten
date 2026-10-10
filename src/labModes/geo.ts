import {
  geoArea,
  geoContains,
  geoDistance,
  geoInterpolate,
  type GeoPermissibleObjects,
} from 'd3-geo'
import type { Feature, Geometry } from 'geojson'

/** Erdradius in km (mittlerer Kugelradius) */
export const EARTH_RADIUS_KM = 6371

export type LonLat = [number, number]

export function areaKm2(feature: Feature<Geometry | null>): number {
  if (!feature.geometry) return 0
  return geoArea(feature as GeoPermissibleObjects) * EARTH_RADIUS_KM * EARTH_RADIUS_KM
}

export function distanceKm(a: LonLat, b: LonLat): number {
  return geoDistance(a, b) * EARTH_RADIUS_KM
}

/** Winkelabstand in Grad (Großkreis). */
export function distanceDeg(a: LonLat, b: LonLat): number {
  return (geoDistance(a, b) * 180) / Math.PI
}

export function greatCirclePoints(a: LonLat, b: LonLat, n: number): LonLat[] {
  const steps = Math.max(2, Math.floor(n))
  const interp = geoInterpolate(a, b)
  const out: LonLat[] = []
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const p = interp(t)
    out.push([p[0]!, p[1]!])
  }
  return out
}

export function antipode([lon, lat]: LonLat): LonLat {
  let outLon = lon + 180
  if (outLon > 180) outLon -= 360
  if (outLon <= -180) outLon += 360
  return [outLon, -lat]
}

export function countryAt(
  lonlat: LonLat,
  features: Feature<Geometry | null>[],
): Feature<Geometry | null> | null {
  for (const f of features) {
    if (f.geometry && geoContains(f as GeoPermissibleObjects, lonlat)) return f
  }
  return null
}

/** Lineare Score-Kurve: max unter `good`, 0 ab `bad`. */
export function linearScore(value: number, good: number, bad: number, max = 100): number {
  if (value <= good) return max
  if (value >= bad) return 0
  return max * (1 - (value - good) / (bad - good))
}

/** Logarithmisches Fits-Scoring: 100 bei Faktor 1, 0 ab Faktor 2. */
export function logRatioScore(guess: number, truth: number, max = 100): number {
  if (!(guess > 0) || !(truth > 0)) return 0
  const factor = Math.max(guess, truth) / Math.min(guess, truth)
  if (factor <= 1) return max
  const log2 = Math.log2(factor)
  return Math.max(0, max * (1 - log2))
}
