import { areaKm2, logRatioScore } from './geo'
import type { CountryFeature } from '../WorldMap'

export function scoreAreaGuess(guessKm2: number, feature: CountryFeature): {
  truth: number
  points: number
} {
  const truth = areaKm2(feature)
  return { truth, points: logRatioScore(guessKm2, truth) }
}
