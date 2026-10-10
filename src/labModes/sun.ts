import { antipode, type LonLat } from './geo'

/**
 * Sonnenstand / Subsolarpunkt.
 * Formeln angelehnt an NOAA Solar Calculator:
 * https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 * (Julian Day, geometrische mittlere Länge/Anomalie, Deklination, Zeitgleichung)
 */

function toJulianDay(date: Date): number {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const D = date.getUTCDate()
  const H = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  let Y = y
  let M = m
  if (M <= 2) {
    Y -= 1
    M += 12
  }
  const A = Math.floor(Y / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5 + H / 24
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180
}

function rad2deg(r: number): number {
  return (r * 180) / Math.PI
}

function normalizeLon(lon: number): number {
  let x = ((((lon + 180) % 360) + 360) % 360) - 180
  if (x === -180) x = 180
  return x
}

/** Subsolarpunkt [lon, lat] für UTC-Zeitpunkt. */
export function subsolarPoint(dateUtc: Date): LonLat {
  const jd = toJulianDay(dateUtc)
  const n = jd - 2451545.0
  // geometrische mittlere Länge / Anomalie (Grad)
  const L = (280.46 + 0.9856474 * n) % 360
  const g = deg2rad((357.528 + 0.9856003 * n) % 360)
  const lambda = deg2rad(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g))
  const epsilon = deg2rad(23.439 - 0.0000004 * n)
  const sinDec = Math.sin(epsilon) * Math.sin(lambda)
  const dec = rad2deg(Math.asin(sinDec))

  // Zeitgleichung in Minuten (NOAA-Näherung)
  const y = Math.tan(epsilon / 2) ** 2
  const Lrad = deg2rad(L)
  const eqTime =
    4 *
    rad2deg(
      y * Math.sin(2 * Lrad) -
        2 * 0.0167 * Math.sin(g) +
        4 * 0.0167 * y * Math.sin(g) * Math.cos(2 * Lrad) -
        0.5 * y * y * Math.sin(4 * Lrad) -
        1.25 * 0.0167 * 0.0167 * Math.sin(2 * g),
    )

  const minutes = dateUtc.getUTCHours() * 60 + dateUtc.getUTCMinutes() + dateUtc.getUTCSeconds() / 60
  // Länge: Sonne im Meridian bei 12:00 + EoT
  const lon = normalizeLon(-15 * (minutes - 720 + eqTime) / 60)
  return [lon, dec]
}

/** Mittelpunkt des Nacht-Halbkreises (= Antipode des Subsolarpunkts). */
export function nightCircleCenter(subsolar: LonLat): LonLat {
  return antipode(subsolar)
}

/** true wenn Punkt auf der Tagseite liegt (Winkel zum Subsolar < 90°). */
export function isDaylight(point: LonLat, subsolar: LonLat): boolean {
  const [lon1, lat1] = point
  const [lon2, lat2] = subsolar
  const φ1 = deg2rad(lat1)
  const φ2 = deg2rad(lat2)
  const Δλ = deg2rad(lon2 - lon1)
  const cosc = Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return cosc > 0
}
