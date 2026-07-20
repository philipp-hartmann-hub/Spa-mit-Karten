import type { Feature, FeatureCollection, Point } from 'geojson'

export type CityProps = {
  id: string
  name: string
  countryId: string
  countryA2: string
  rank: number
  pop: number
}

export type CityFeature = Feature<Point, CityProps> & { id: string }

let cache: CityFeature[] | null = null
let byCountry = new Map<string, CityFeature[]>()

export async function loadCities(): Promise<CityFeature[]> {
  if (cache) return cache
  const res = await fetch('/cities-top10.geojson')
  const fc = (await res.json()) as FeatureCollection<Point, CityProps>
  cache = fc.features.map((f) => {
    const id = f.properties.id
    return { ...f, id } as CityFeature
  })
  byCountry = new Map()
  for (const c of cache) {
    const list = byCountry.get(c.properties.countryId) ?? []
    list.push(c)
    byCountry.set(c.properties.countryId, list)
  }
  return cache
}

export function citiesForCountry(countryId: string): CityFeature[] {
  return byCountry.get(countryId) ?? []
}

export function countriesWithCities(min = 3): string[] {
  return [...byCountry.keys()].filter((id) => (byCountry.get(id)?.length ?? 0) >= min)
}

export function cityLabel(city: CityFeature): string {
  return city.properties.name
}
