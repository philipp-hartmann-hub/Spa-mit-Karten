import { geoRotation } from 'd3-geo'
import type { Geometry } from 'geojson'

type LonLat = [number, number]

function mapCoords(coords: unknown, rot: (p: LonLat) => LonLat | null): unknown {
  if (!Array.isArray(coords)) return coords
  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return rot([coords[0], coords[1]]) ?? coords
  }
  return coords.map((c) => mapCoords(c, rot))
}

/** Verschiebt Geometrie so, dass fromCentroid → toCentroid (Sphärenrotation). */
export function rotateGeometryTo(
  geometry: Geometry,
  fromCentroid: LonLat,
  toCentroid: LonLat,
): Geometry {
  const rot = geoRotation([
    -(toCentroid[0] - fromCentroid[0]),
    -(toCentroid[1] - fromCentroid[1]),
    0,
  ])
  if (geometry.type === 'GeometryCollection') {
    return {
      type: 'GeometryCollection',
      geometries: geometry.geometries.map((g) => rotateGeometryTo(g, fromCentroid, toCentroid)),
    }
  }
  return {
    ...geometry,
    coordinates: mapCoords(geometry.coordinates, (p) => {
      const q = rot(p)
      return q ? [q[0]!, q[1]!] : p
    }),
  } as Geometry
}
