import { describe, expect, it } from 'vitest'
import { share, solve, type XYPoint } from './split'

describe('split math', () => {
  it('solves median for symmetric distribution', () => {
    const points: XYPoint[] = [
      { x: -10, y: 0, pop: 50 },
      { x: 0, y: 0, pop: 1 },
      { x: 10, y: 0, pop: 50 },
    ]
    const theta = 0 // normal along +x
    const offset = solve(points, theta)
    expect(offset).toBeCloseTo(0, 5)
    expect(share(points, theta, offset)).toBeCloseTo(0.5, 1)
  })

  it('share left of offset', () => {
    const points: XYPoint[] = [
      { x: -1, y: 0, pop: 100 },
      { x: 1, y: 0, pop: 100 },
    ]
    expect(share(points, 0, 0)).toBeCloseTo(0.5, 5)
    expect(share(points, 0, -2)).toBe(0)
  })
})
