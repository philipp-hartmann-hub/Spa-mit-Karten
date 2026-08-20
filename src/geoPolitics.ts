import type { Feature, Geometry } from 'geojson'

export type CountryFeature = Feature<Geometry, { name: string }> & { id?: string | number }

function normalizeId(id: string | number | undefined | null): string {
  if (id === undefined || id === null || id === '') return ''
  return String(id).padStart(3, '0')
}

/**
 * Natural-Earth-110m-Korrekturen fürs Spiel:
 * - Kosovo hat keine ISO-ID → 983 (XK), damit es wählbar ist
 * - Krim liegt in den Rohdaten bei Russland → zur Ukraine verschieben
 */
export function fixCountryFeatures(features: CountryFeature[]): CountryFeature[] {
  const next = features.map((f) => ({
    ...f,
    properties: { ...f.properties },
    geometry: f.geometry ? structuredClone(f.geometry) : f.geometry,
  })) as CountryFeature[]

  const kosovo = next.find((f) => {
    const name = f.properties?.name
    const id = f.id
    const missingId = id === undefined || id === null || id === -99 || id === ''
    return name === 'Kosovo' && missingId
  })
  if (kosovo) {
    kosovo.id = '983'
    kosovo.properties.name = 'Kosovo'
  }

  const russia = next.find((f) => normalizeId(f.id) === '643')
  const ukraine = next.find((f) => normalizeId(f.id) === '804')
  if (
    russia?.geometry?.type === 'MultiPolygon' &&
    ukraine?.geometry &&
    (ukraine.geometry.type === 'Polygon' || ukraine.geometry.type === 'MultiPolygon')
  ) {
    const ruPolys = russia.geometry.coordinates as number[][][][]
    const crimeaIndex = ruPolys.findIndex((poly) => {
      const ring = poly[0]
      if (!ring?.length) return false
      let x = 0
      let y = 0
      const n = Math.max(1, ring.length - 1)
      for (let i = 0; i < n; i++) {
        x += ring[i]![0]!
        y += ring[i]![1]!
      }
      const cx = x / n
      const cy = y / n
      return cx > 32 && cx < 37 && cy > 44 && cy < 47
    })

    if (crimeaIndex >= 0) {
      const crimea = ruPolys.splice(crimeaIndex, 1)[0]
      if (crimea) {
        if (ukraine.geometry.type === 'Polygon') {
          ukraine.geometry = {
            type: 'MultiPolygon',
            coordinates: [ukraine.geometry.coordinates as number[][][], crimea],
          }
        } else {
          ;(ukraine.geometry.coordinates as number[][][][]).push(crimea)
        }
        if (ruPolys.length === 1) {
          russia.geometry = {
            type: 'Polygon',
            coordinates: ruPolys[0] as number[][][],
          }
        }
      }
    }
  }

  return next
}
