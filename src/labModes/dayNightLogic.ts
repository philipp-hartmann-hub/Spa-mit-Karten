import { distanceDeg, linearScore, type LonLat } from './geo'
import { isDaylight, subsolarPoint } from './sun'

export function scoreSubsolar(guess: LonLat, truth: LonLat): number {
  return linearScore(distanceDeg(guess, truth), 3, 40)
}

export type DayNightFact = { kind: 'polar' | 'terminator'; city: string; day: boolean }

const FACT_CITIES: { name: string; lonlat: LonLat }[] = [
  { name: 'Tromsø', lonlat: [18.9553, 69.6492] },
  { name: 'Sydney', lonlat: [151.2093, -33.8688] },
  { name: 'Reykjavík', lonlat: [-21.8277, 64.1283] },
  { name: 'Ushuaia', lonlat: [-68.3029, -54.8019] },
  { name: 'Singapore', lonlat: [103.8198, 1.3521] },
  { name: 'Anchorage', lonlat: [-149.9003, 61.2181] },
]

export function factsForSubsolar(subsolar: LonLat): DayNightFact[] {
  const out: DayNightFact[] = []
  for (const c of FACT_CITIES) {
    const day = isDaylight(c.lonlat, subsolar)
    if (Math.abs(c.lonlat[1]) > 66) {
      out.push({ kind: 'polar', city: c.name, day })
    } else if (Math.abs(distanceDeg(c.lonlat, subsolar) - 90) < 12) {
      out.push({ kind: 'terminator', city: c.name, day })
    }
  }
  return out.slice(0, 2)
}

/** Slider mapping: hour 0..24 → lon component; dayOfYear 0..365 → declination-ish date. */
export function subsolarFromSliders(hourUtc: number, dayOfYear: number, year = 2024): LonLat {
  const date = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
  date.setUTCDate(dayOfYear)
  date.setUTCHours(Math.floor(hourUtc), Math.round((hourUtc % 1) * 60), 0, 0)
  return subsolarPoint(date)
}
