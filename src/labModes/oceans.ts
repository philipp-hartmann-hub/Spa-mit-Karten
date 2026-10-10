export type OceanId = 'pacific' | 'atlantic' | 'indian' | 'arctic' | 'southern'

type Box = { id: OceanId; lonMin: number; lonMax: number; latMin: number; latMax: number }

/** Grobe Lon/Lat-Boxen für Ozean-Namen (Überlappungen: erste Treffer gewinnt). */
const BOXES: Box[] = [
  { id: 'arctic', lonMin: -180, lonMax: 180, latMin: 66, latMax: 90 },
  { id: 'southern', lonMin: -180, lonMax: 180, latMin: -90, latMax: -50 },
  { id: 'indian', lonMin: 20, lonMax: 147, latMin: -50, latMax: 30 },
  { id: 'atlantic', lonMin: -70, lonMax: 20, latMin: -50, latMax: 66 },
  { id: 'pacific', lonMin: -180, lonMax: -70, latMin: -50, latMax: 66 },
  { id: 'pacific', lonMin: 147, lonMax: 180, latMin: -50, latMax: 66 },
]

export function oceanAt(lon: number, lat: number): OceanId | null {
  for (const b of BOXES) {
    if (lon >= b.lonMin && lon <= b.lonMax && lat >= b.latMin && lat <= b.latMax) {
      return b.id
    }
  }
  // Datumsgrenze: westlicher Pazifik
  if (lon < -70 || lon > 147) {
    if (lat > -50 && lat < 66) return 'pacific'
  }
  return null
}
