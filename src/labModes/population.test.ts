import { describe, expect, it } from 'vitest'
import { shareNorthOf, sumInCircle, weightedCentroid, type PopPoint } from './population'

describe('population helpers', () => {
  const grid: PopPoint[] = [
    [0, 0, 100],
    [10, 0, 100],
    [0, 10, 100],
    [0, -10, 50],
  ]

  it('sumInCircle counts nearby population', () => {
    expect(sumInCircle(grid, [0, 0], 1)).toBe(100)
    expect(sumInCircle(grid, [0, 0], 2000)).toBeGreaterThan(100)
  })

  it('weightedCentroid stays near denser cluster', () => {
    const c = weightedCentroid([
      [0, 0, 1],
      [10, 0, 1000],
    ])
    expect(c).toBeTruthy()
    expect(c![0]).toBeGreaterThan(8)
  })

  it('shareNorthOf returns fraction', () => {
    expect(shareNorthOf(grid, 0)).toBeCloseTo(300 / 350, 5)
  })
})
