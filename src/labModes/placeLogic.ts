import { geoCentroid } from 'd3-geo'
import type { CountryFeature } from '../WorldMap'
import { distanceKm, linearScore, type LonLat } from './geo'
import { rotateGeometryTo } from './rotateGeom'
import type { Geometry } from 'geojson'

export type PlaceDifficulty = 'easy' | 'medium' | 'hard'

export function scorePlace(placed: LonLat, truth: LonLat): number {
  return linearScore(distanceKm(placed, truth), 100, 3000)
}

export function placeGeometryAt(
  feature: CountryFeature,
  targetCentroid: LonLat,
): Geometry | null {
  if (!feature.geometry) return null
  const from = geoCentroid(feature) as LonLat
  return rotateGeometryTo(feature.geometry, from, targetCentroid)
}

export function neighborIds(
  target: CountryFeature,
  all: CountryFeature[],
  limit = 8,
): string[] {
  const tc = geoCentroid(target) as LonLat
  return all
    .filter((c) => c !== target)
    .map((c) => ({ id: String(c.id).padStart(3, '0'), d: distanceKm(tc, geoCentroid(c) as LonLat) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.id)
}
