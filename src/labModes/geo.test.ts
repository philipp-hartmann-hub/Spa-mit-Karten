import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { describe, expect, it } from 'vitest'
import { antipode, areaKm2, distanceKm } from './geo'
import { fixCountryFeatures } from '../geoPolitics'

function padId(id: string | number | undefined | null): string {
  if (id === undefined || id === null || id === '') return ''
  return String(id).padStart(3, '0')
}

const here = dirname(fileURLToPath(import.meta.url))

describe('geo helpers', () => {
  it('antipode of 0/0 is 180/0', () => {
    const [lon, lat] = antipode([0, 0])
    expect(lon).toBeCloseTo(180, 5)
    expect(lat).toBeCloseTo(0, 5)
  })

  it('distance Berlin–Paris is about 880 km', () => {
    const berlin: [number, number] = [13.405, 52.52]
    const paris: [number, number] = [2.3522, 48.8566]
    const d = distanceKm(berlin, paris)
    expect(d).toBeGreaterThan(830)
    expect(d).toBeLessThan(930)
  })

  it('area of Germany is about 357000 km²', () => {
    const raw = readFileSync(resolve(here, '../../public/countries-110m.json'), 'utf8')
    const topo = JSON.parse(raw) as Topology<{ countries: GeometryCollection }>
    const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>
    const fixed = fixCountryFeatures(fc.features as Parameters<typeof fixCountryFeatures>[0])
    const de = fixed.find((f) => padId(f.id) === '276')
    expect(de).toBeTruthy()
    const km2 = areaKm2(de!)
    expect(km2).toBeGreaterThan(300_000)
    expect(km2).toBeLessThan(420_000)
  })
})
