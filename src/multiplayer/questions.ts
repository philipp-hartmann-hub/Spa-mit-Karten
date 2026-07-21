import { hasCapital } from '../capitals'
import { pickBlitzChallenge } from '../blitz'
import { hasCountryFlag, hasRegionFlag } from '../flags'
import { hasRegionCapital } from '../regionCapitals'
import {
  countriesWithRegionCapitals,
  countriesWithRegions,
  regionsForCountry,
  regionsWithCapitals,
  type RegionFeature,
} from '../admin1'
import { citiesForCountry, countriesWithCities, type CityFeature } from '../cities'
import { matchesContinent, type ContinentFilter } from '../continents'
import type { GameMode, RegionQuiz } from '../gameModes'
import type { Locale } from '../i18n/types'
import { flagColorsOf } from '../flagColors'
import { normalizeId, type CountryFeature } from '../WorldMap'
import type { MpBlitzQuestion, MpGameConfig, MpRaceQuestion } from './types'

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function pickRandom<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]!
}

/** Ziehe `count` Elemente ohne Wiederholung, solange der Pool reicht; danach ggf. mit Wiederholung. */
function takeUniqueThenFill<T>(pool: T[], count: number, keyOf: (item: T) => string): T[] {
  if (pool.length === 0 || count <= 0) return []
  const shuffled = shuffle(pool)
  const out: T[] = []
  const used = new Set<string>()
  for (const item of shuffled) {
    if (out.length >= count) break
    const k = keyOf(item)
    if (used.has(k)) continue
    used.add(k)
    out.push(item)
  }
  while (out.length < count) {
    out.push(pickRandom(pool))
  }
  return out
}

function buildPool(
  allCountries: CountryFeature[],
  config: MpGameConfig,
  regionCountryIds: Set<string>,
  regionCapitalCountryIds: Set<string>,
  regionFlagCountryIds: Set<string>,
  cityCountryIds: Set<string>,
): CountryFeature[] {
  const continent = config.continent as ContinentFilter
  const mode = config.mode as GameMode
  const byContinent = allCountries.filter((c) =>
    matchesContinent(normalizeId(c.id), continent),
  )
  if (mode === 'capital') {
    return byContinent.filter((c) => hasCapital(normalizeId(c.id)))
  }
  if (mode === 'flag') {
    return byContinent.filter((c) => hasCountryFlag(normalizeId(c.id)))
  }
  if (mode === 'cities') {
    return byContinent.filter((c) => cityCountryIds.has(normalizeId(c.id)))
  }
  if (mode === 'blitz') {
    return byContinent.filter((c) => {
      const id = normalizeId(c.id)
      return hasCapital(id) && flagColorsOf(id).length > 0
    })
  }
  if (mode === 'regions') {
    const quiz = (config.regionQuiz ?? 'name') as RegionQuiz
    const allowed =
      quiz === 'capital'
        ? regionCapitalCountryIds
        : quiz === 'flag'
          ? regionFlagCountryIds
          : regionCountryIds
    return byContinent.filter((c) => allowed.has(normalizeId(c.id)))
  }
  return byContinent
}

export function generateRaceQuestions(
  allCountries: CountryFeature[],
  config: MpGameConfig,
): MpRaceQuestion[] {
  const regionCountryIds = new Set(countriesWithRegions())
  const regionCapitalCountryIds = new Set(countriesWithRegionCapitals(hasRegionCapital))
  const regionFlagCountryIds = new Set(countriesWithRegionCapitals(hasRegionFlag))
  const cityCountryIds = new Set(countriesWithCities(3))
  const pool = buildPool(
    allCountries,
    config,
    regionCountryIds,
    regionCapitalCountryIds,
    regionFlagCountryIds,
    cityCountryIds,
  )
  if (pool.length === 0) return []

  const mode = config.mode

  if (mode === 'cities') {
    const country =
      pool.find((c) => normalizeId(c.id) === config.regionCountryId) ?? pickRandom(pool)
    const countryId = normalizeId(country.id)
    const cities = shuffle(citiesForCountry(countryId)) as CityFeature[]
    return cities.map((city) => ({
      kind: 'city' as const,
      countryId,
      cityId: city.properties.id,
    }))
  }

  if (mode === 'regions') {
    const country =
      pool.find((c) => normalizeId(c.id) === config.regionCountryId) ?? pickRandom(pool)
    const countryId = normalizeId(country.id)
    const quiz = (config.regionQuiz ?? 'name') as RegionQuiz
    const allRegions = regionsForCountry(countryId)
    const quizPool =
      quiz === 'capital'
        ? regionsWithCapitals(countryId, hasRegionCapital)
        : quiz === 'flag'
          ? regionsWithCapitals(countryId, hasRegionFlag)
          : allRegions
    if (quizPool.length === 0) return []
    const picked = takeUniqueThenFill(
      quizPool as RegionFeature[],
      config.rounds,
      (r) => r.properties.id,
    )
    return picked.map((region) => ({
      kind: 'region' as const,
      countryId,
      regionId: region.properties.id,
      quiz,
    }))
  }

  const picked = takeUniqueThenFill(pool, config.rounds, (c) => normalizeId(c.id))
  return picked.map((country) => {
    const id = normalizeId(country.id)
    if (mode === 'capital') return { kind: 'capital' as const, targetId: id }
    if (mode === 'flag') return { kind: 'flag' as const, targetId: id }
    return { kind: 'country' as const, targetId: id }
  })
}

export function generateBlitzQuestions(
  allCountries: CountryFeature[],
  config: MpGameConfig,
): MpBlitzQuestion[] {
  const pool = buildPool(
    allCountries,
    config,
    new Set(),
    new Set(),
    new Set(),
    new Set(),
  )
  const locale = (config.locale as Locale) || 'de'
  const out: MpBlitzQuestion[] = []
  const used = new Set<string>()
  let guard = 0

  while (out.length < config.rounds && guard++ < config.rounds * 60) {
    const next = pickBlitzChallenge(pool, locale)
    if (!next) break
    const key = `${next.letter}|${next.color}`
    if (used.has(key)) continue
    used.add(key)
    out.push({ letter: next.letter, color: next.color })
  }

  while (out.length < config.rounds) {
    const next = pickBlitzChallenge(pool, locale)
    if (!next) break
    out.push({ letter: next.letter, color: next.color })
  }

  return out
}

/** Score blitz round: unique filled slot = 2, shared = 1 */
export function scoreBlitzRound(
  answersByPlayer: Record<
    string,
    { country: string | null; capital: string | null; flag: string | null }
  >,
): Record<string, number> {
  const categories = ['country', 'capital', 'flag'] as const
  const points: Record<string, number> = {}
  for (const pid of Object.keys(answersByPlayer)) points[pid] = 0

  for (const cat of categories) {
    const counts = new Map<string, string[]>()
    for (const [pid, ans] of Object.entries(answersByPlayer)) {
      const val = ans[cat]
      if (!val) continue
      const list = counts.get(val) ?? []
      list.push(pid)
      counts.set(val, list)
    }
    for (const [, pids] of counts) {
      const pts = pids.length === 1 ? 2 : 1
      for (const pid of pids) points[pid] = (points[pid] ?? 0) + pts
    }
  }
  return points
}
