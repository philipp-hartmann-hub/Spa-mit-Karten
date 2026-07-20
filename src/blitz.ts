import { capitalOf } from './capitals'
import {
  FLAG_COLOR_OPTIONS,
  flagHasColor,
  type FlagColor,
} from './flagColors'
import { countryLabel, normalizeId, type CountryFeature } from './WorldMap'

export const BLITZ_SECONDS = 30

export type BlitzCategory = 'country' | 'capital' | 'flag'

export type BlitzAnswers = {
  country: string | null
  capital: string | null
  flag: string | null
}

export type BlitzChallenge = {
  letter: string
  color: FlagColor
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '')
}

export function initialLetter(text: string): string {
  const cleaned = stripDiacritics(text.trim())
  return cleaned.charAt(0).toUpperCase()
}

export function startsWithLetter(text: string, letter: string): boolean {
  return initialLetter(text) === letter.toUpperCase()
}

export function emptyBlitzAnswers(): BlitzAnswers {
  return { country: null, capital: null, flag: null }
}

export function blitzFilledCount(answers: BlitzAnswers): number {
  return (answers.country ? 1 : 0) + (answers.capital ? 1 : 0) + (answers.flag ? 1 : 0)
}

export function blitzComplete(answers: BlitzAnswers): boolean {
  return blitzFilledCount(answers) === 3
}

export function countryMatchesBlitzCountry(feature: CountryFeature, letter: string): boolean {
  return startsWithLetter(countryLabel(feature), letter)
}

export function countryMatchesBlitzCapital(feature: CountryFeature, letter: string): boolean {
  const cap = capitalOf(normalizeId(feature.id))
  return !!cap && startsWithLetter(cap, letter)
}

export function countryMatchesBlitzFlag(feature: CountryFeature, color: FlagColor): boolean {
  return flagHasColor(normalizeId(feature.id), color)
}

/** Welche noch offene Kategorie der Klick erfüllen würde (Priorität: Land → Hauptstadt → Flagge) */
export function matchBlitzCategory(
  feature: CountryFeature,
  challenge: BlitzChallenge,
  answers: BlitzAnswers,
): BlitzCategory | null {
  const id = normalizeId(feature.id)
  if (
    !answers.country &&
    countryMatchesBlitzCountry(feature, challenge.letter) &&
    answers.capital !== id &&
    answers.flag !== id
  ) {
    return 'country'
  }
  if (
    !answers.capital &&
    countryMatchesBlitzCapital(feature, challenge.letter) &&
    answers.country !== id &&
    answers.flag !== id
  ) {
    return 'capital'
  }
  if (
    !answers.flag &&
    countryMatchesBlitzFlag(feature, challenge.color) &&
    answers.country !== id &&
    answers.capital !== id
  ) {
    return 'flag'
  }
  return null
}

function lettersWithSolutions(pool: CountryFeature[]): string[] {
  const nameLetters = new Set<string>()
  const capitalLetters = new Set<string>()
  for (const c of pool) {
    nameLetters.add(initialLetter(countryLabel(c)))
    const cap = capitalOf(normalizeId(c.id))
    if (cap) capitalLetters.add(initialLetter(cap))
  }
  return [...nameLetters].filter((l) => capitalLetters.has(l)).sort()
}

function colorsWithSolutions(pool: CountryFeature[]): FlagColor[] {
  return FLAG_COLOR_OPTIONS.map((c) => c.id).filter((color) =>
    pool.some((f) => flagHasColor(normalizeId(f.id), color)),
  )
}

export function pickBlitzChallenge(pool: CountryFeature[]): BlitzChallenge | null {
  const letters = lettersWithSolutions(pool)
  const colors = colorsWithSolutions(pool)
  if (letters.length === 0 || colors.length === 0) return null
  return {
    letter: letters[Math.floor(Math.random() * letters.length)]!,
    color: colors[Math.floor(Math.random() * colors.length)]!,
  }
}
