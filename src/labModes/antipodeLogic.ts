import { distanceKm, linearScore, type LonLat } from './geo'

export function scoreAntipodeGuess(guess: LonLat, truth: LonLat): number {
  return linearScore(distanceKm(guess, truth), 300, 5000)
}

export function scoreAntipodeMc(correct: boolean): number {
  return correct ? 100 : 0
}
