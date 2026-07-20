import type { Feature, FeatureCollection, Geometry } from 'geojson'

export type RegionProps = {
  id: string
  name: string
  countryId: string
  countryA2: string
  type: string
}

export type RegionFeature = Feature<Geometry, RegionProps> & { id: string }

const NAME_OVERRIDES: Record<string, string> = {
  'DE-HB': 'Bremen',
  'DE-HH': 'Hamburg',
  'DE-BE': 'Berlin',
  'US-DC': 'Washington, D.C.',
}

let cache: RegionFeature[] | null = null
let byCountry = new Map<string, RegionFeature[]>()

export async function loadRegions(): Promise<RegionFeature[]> {
  if (cache) return cache
  const res = await fetch('/admin1.geojson')
  const fc = (await res.json()) as FeatureCollection<Geometry, RegionProps>
  cache = fc.features.map((f) => {
    const id = f.properties.id
    const name = NAME_OVERRIDES[id] ?? f.properties.name
    return {
      ...f,
      id,
      properties: { ...f.properties, name },
    } as RegionFeature
  })
  byCountry = new Map()
  for (const r of cache) {
    const list = byCountry.get(r.properties.countryId) ?? []
    list.push(r)
    byCountry.set(r.properties.countryId, list)
  }
  return cache
}

export function regionsForCountry(countryId: string): RegionFeature[] {
  return byCountry.get(countryId) ?? []
}

export function countriesWithRegions(): string[] {
  return [...byCountry.keys()].filter((id) => (byCountry.get(id)?.length ?? 0) >= 3)
}

export function regionLabel(region: RegionFeature): string {
  return region.properties.name
}

export function regionsWithCapitals(
  countryId: string,
  hasCapital: (regionId: string) => boolean,
): RegionFeature[] {
  return regionsForCountry(countryId).filter((r) => hasCapital(r.properties.id))
}

export function countriesWithRegionCapitals(hasCapital: (regionId: string) => boolean): string[] {
  return countriesWithRegions().filter(
    (id) => regionsWithCapitals(id, hasCapital).length >= 3,
  )
}
