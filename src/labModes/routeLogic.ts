import type { GeoProjection } from 'd3-geo'
import { distanceKm, greatCirclePoints, linearScore, type LonLat } from './geo'

export function resampleLonLat(points: LonLat[], n: number): LonLat[] {
  if (points.length === 0) return []
  if (points.length === 1) return Array.from({ length: n }, () => points[0]!)
  const segLens: number[] = [0]
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += distanceKm(points[i - 1]!, points[i]!)
    segLens.push(total)
  }
  if (total <= 0) return Array.from({ length: n }, () => points[0]!)
  const out: LonLat[] = []
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * total
    let s = 1
    while (s < segLens.length && segLens[s]! < target) s++
    const a = points[s - 1]!
    const b = points[Math.min(s, points.length - 1)]!
    const t0 = segLens[s - 1]!
    const t1 = segLens[Math.min(s, segLens.length - 1)]!
    const u = t1 > t0 ? (target - t0) / (t1 - t0) : 0
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u])
  }
  return out
}

export function pixelsToLonLat(
  pixels: [number, number][],
  projection: GeoProjection,
): LonLat[] {
  const out: LonLat[] = []
  for (const [x, y] of pixels) {
    const inv = projection.invert?.([x, y])
    if (inv) out.push([inv[0], inv[1]])
  }
  return out
}

export function meanDeviationKm(drawn: LonLat[], great: LonLat[]): number {
  const n = Math.min(drawn.length, great.length)
  if (n === 0) return Infinity
  let sum = 0
  for (let i = 0; i < n; i++) sum += distanceKm(drawn[i]!, great[i]!)
  return sum / n
}

export function scoreRouteError(errKm: number): number {
  return linearScore(errKm, 150, 2000)
}

export function snapOk(
  pixels: [number, number][],
  startPx: [number, number],
  endPx: [number, number],
  radius = 25,
): boolean {
  if (pixels.length < 2) return false
  const a = pixels[0]!
  const b = pixels[pixels.length - 1]!
  return (
    Math.hypot(a[0] - startPx[0], a[1] - startPx[1]) <= radius &&
    Math.hypot(b[0] - endPx[0], b[1] - endPx[1]) <= radius
  )
}

export function pathLengthKm(points: LonLat[]): number {
  let s = 0
  for (let i = 1; i < points.length; i++) s += distanceKm(points[i - 1]!, points[i]!)
  return s
}

export { greatCirclePoints }
