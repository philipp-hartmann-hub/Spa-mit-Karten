import { describe, expect, it } from 'vitest'
import { subsolarPoint } from './sun'

describe('sun / subsolarPoint', () => {
  it('March equinox ~12:00 UTC is near 0°/0°', () => {
    // 20 Mar 2024 12:00 UTC near equinox
    const [lon, lat] = subsolarPoint(new Date(Date.UTC(2024, 2, 20, 12, 0, 0)))
    expect(Math.abs(lat)).toBeLessThan(3)
    expect(Math.abs(lon)).toBeLessThan(8)
  })

  it('June solstice latitude is about +23.44°', () => {
    const [, lat] = subsolarPoint(new Date(Date.UTC(2024, 5, 21, 12, 0, 0)))
    expect(lat).toBeGreaterThan(22)
    expect(lat).toBeLessThan(24.5)
  })
})
