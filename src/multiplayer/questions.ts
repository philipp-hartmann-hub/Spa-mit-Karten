import { capitalOf, hasCapital } from '../capitals'
import { pickBlitzChallenge } from '../blitz'
import { hasCountryFlag } from '../flags'
import { hasRegionCapital } from '../regionCapitals'
import { hasRegionFlag } from '../flags'
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
import { countryLabel, normalizeId, type CountryFeature } from '../WorldMap'
import type { MpBlitzQuestion, MpGameConfig, MpRaceQuestion } from './types'

function pickRandom<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]!
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

  const questions: MpRaceQuestion[] = []
  const mode = config.mode

  for (let i = 0; i < config.rounds; i++) {
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
      if (quizPool.length === 0) continue
      const region = pickRandom(quizPool) as RegionFeature
      questions.push({
        kind: 'region',
        countryId,
        regionId: region.properties.id,
        quiz,
      })
      continue
    }

    if (mode === 'cities') {
      const country =
        pool.find((c) => normalizeId(c.id) === config.regionCountryId) ?? pickRandom(pool)
      const countryId = normalizeId(country.id)
      const cities = citiesForCountry(countryId)
      if (cities.length === 0) continue
      const city = pickRandom(cities) as CityFeature
      questions.push({ kind: 'city', countryId, cityId: city.properties.id })
      continue
    }

    const country = pickRandom(pool)
    const id = normalizeId(country.id)
    if (mode === 'capital') questions.push({ kind: 'capital', targetId: id })
    else if (mode === 'flag') questions.push({ kind: 'flag', targetId: id })
    else questions.push({ kind: 'country', targetId: id })
  }

  return questions
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
  for (let i = 0; i < config.rounds; i++) {
    const challenge = pickBlitzChallenge(pool, locale)
    if (!challenge) break
    out.push({ letter: challenge.letter, color: challenge.color })
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

export function describeRaceTarget(
  q: MpRaceQuestion,
  allCountries: CountryFeature[],
  locale: Locale,
): { promptLabelKey: string; promptValue: string | null; flagUrl: string | null } {
  if (q.kind === 'country') {
    const f = allCountries.find((c) => normalizeId(c.id) === q.targetId)
    return {
      promptLabelKey: 'promptFind',
      promptValue: f ? countryLabel(f, locale) : '…',
      flagUrl: null,
    }
  }
  if (q.kind === 'capital') {
    return {
      promptLabelKey: 'promptCapital',
      promptValue: capitalOf(q.targetId, locale) ?? '…',
      flagUrl: null,
    }
  }
  if (q.kind === 'flag') {
    return {
      promptLabelKey: 'promptFlag',
      promptValue: null,
      flagUrl: hasCountryFlag(q.targetId) ? `/flags unused` : null,
    }
  }
  return { promptLabelKey: 'promptFind', promptValue: '…', flagUrl: null }
}
