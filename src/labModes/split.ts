import type { GeoProjection } from 'd3-geo'
import type { PopPoint } from './population'

export type XYPoint = { x: number; y: number; pop: number }

export function projectPoints(points: PopPoint[], projection: GeoProjection): XYPoint[] {
  const out: XYPoint[] = []
  for (const [lon, lat, pop] of points) {
    const p = projection([lon, lat])
    if (!p) continue
    out.push({ x: p[0]!, y: p[1]!, pop })
  }
  return out
}

/** Anteil links der Linie (Normalenrichtung theta, Offset). */
export function share(points: XYPoint[], theta: number, offset: number): number {
  const nx = Math.cos(theta)
  const ny = Math.sin(theta)
  let left = 0
  let total = 0
  for (const p of points) {
    total += p.pop
    const proj = p.x * nx + p.y * ny
    if (proj <= offset) left += p.pop
  }
  if (!(total > 0)) return 0
  return left / total
}

/** Gewichteter Median der Projektion auf den Normalenvektor. */
export function solve(points: XYPoint[], theta: number): number {
  const nx = Math.cos(theta)
  const ny = Math.sin(theta)
  const scored = points
    .map((p) => ({ t: p.x * nx + p.y * ny, pop: p.pop }))
    .filter((p) => p.pop > 0)
    .sort((a, b) => a.t - b.t)
  const total = scored.reduce((s, p) => s + p.pop, 0)
  if (!(total > 0) || scored.length === 0) return 0
  let acc = 0
  const half = total / 2
  for (const p of scored) {
    acc += p.pop
    if (acc >= half) return p.t
  }
  return scored[scored.length - 1]!.t
}

export function solveThroughPoint(
  points: XYPoint[],
  anchor: { x: number; y: number },
): number {
  let bestTheta = 0
  let bestErr = Infinity
  for (let deg = 0; deg < 180; deg += 0.5) {
    const theta = (deg * Math.PI) / 180
    const nx = Math.cos(theta)
    const ny = Math.sin(theta)
    const offset = anchor.x * nx + anchor.y * ny
    const s = share(points, theta, offset)
    const err = Math.abs(s - 0.5)
    if (err < bestErr) {
      bestErr = err
      bestTheta = theta
    }
  }
  // binäre Verfeinerung um bestTheta
  let lo = bestTheta - (0.5 * Math.PI) / 180
  let hi = bestTheta + (0.5 * Math.PI) / 180
  for (let i = 0; i < 16; i++) {
    const mid1 = lo + (hi - lo) / 3
    const mid2 = hi - (hi - lo) / 3
    const e1 = errAt(points, anchor, mid1)
    const e2 = errAt(points, anchor, mid2)
    if (e1 < e2) hi = mid2
    else lo = mid1
  }
  return (lo + hi) / 2
}

function errAt(
  points: XYPoint[],
  anchor: { x: number; y: number },
  theta: number,
): number {
  const nx = Math.cos(theta)
  const ny = Math.sin(theta)
  const offset = anchor.x * nx + anchor.y * ny
  return Math.abs(share(points, theta, offset) - 0.5)
}
