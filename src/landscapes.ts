import type { Feature, FeatureCollection, MultiLineString, Polygon } from 'geojson'

export type LandscapeKind = 'forest' | 'desert' | 'mountain' | 'grass' | 'ice'

type LandscapeFeature = Feature<Polygon | MultiLineString, { kind: LandscapeKind; name: string }>

/**
 * Physische Landschaftsschicht (unabhängig von Staatsgrenzen).
 * Stilistisch vereinfacht, aber geografisch grob korrekt platziert.
 */
export const LANDSCAPES: FeatureCollection<Polygon | MultiLineString, { kind: LandscapeKind; name: string }> = {
  type: 'FeatureCollection',
  features: [
    // —— Eis / Tundra ——
    poly('ice', 'Grönland-Eis', [
      [-55, 83], [-20, 82], [-18, 70], [-40, 62], [-55, 68], [-60, 75], [-55, 83],
    ]),
    poly('ice', 'Arktis-Kanada', [
      [-120, 75], [-90, 78], [-70, 72], [-80, 65], [-110, 68], [-120, 75],
    ]),
    poly('ice', 'Sibirien-Tundra', [
      [60, 72], [100, 74], [140, 72], [170, 68], [140, 64], [100, 66], [60, 68], [60, 72],
    ]),
    poly('ice', 'Patagonien-Eis', [
      [-75, -48], [-70, -50], [-68, -55], [-72, -54], [-75, -50], [-75, -48],
    ]),

    // —— Grasland / Steppe ——
    poly('grass', 'Nordamerikanische Prärie', [
      [-110, 50], [-95, 49], [-90, 42], [-100, 35], [-110, 38], [-115, 45], [-110, 50],
    ]),
    poly('grass', 'Pampa', [
      [-65, -30], [-55, -32], [-57, -40], [-65, -38], [-68, -33], [-65, -30],
    ]),
    poly('grass', 'Eurasische Steppe', [
      [30, 52], [60, 54], [90, 50], [110, 48], [100, 42], [70, 44], [40, 46], [30, 52],
    ]),
    poly('grass', 'Ostafrikanische Savanne', [
      [30, 8], [40, 6], [42, -2], [38, -8], [30, -6], [28, 2], [30, 8],
    ]),
    poly('grass', 'Sahel', [
      [-16, 18], [10, 18], [30, 16], [35, 14], [20, 12], [0, 13], [-14, 15], [-16, 18],
    ]),
    poly('grass', 'Australien-Outback-Rand', [
      [115, -18], [140, -16], [145, -22], [140, -28], [120, -28], [115, -22], [115, -18],
    ]),

    // —— Wälder ——
    poly('forest', 'Amazonas', [
      [-75, 5], [-68, 4], [-60, 2], [-52, -2], [-50, -10], [-55, -15],
      [-62, -12], [-70, -8], [-74, -2], [-75, 5],
    ]),
    poly('forest', 'Atlantischer Regenwald', [
      [-48, -10], [-40, -12], [-39, -22], [-45, -25], [-50, -20], [-48, -10],
    ]),
    poly('forest', 'Kongo', [
      [8, 5], [18, 6], [28, 4], [30, -2], [25, -8], [14, -6], [10, 0], [8, 5],
    ]),
    poly('forest', 'Westafrika', [
      [-14, 10], [-4, 8], [2, 6], [0, 4], [-8, 5], [-14, 7], [-14, 10],
    ]),
    poly('forest', 'Taiga Europa-Asien', [
      [25, 66], [60, 68], [100, 66], [140, 64], [160, 60], [140, 54],
      [100, 56], [60, 58], [30, 60], [25, 66],
    ]),
    poly('forest', 'Nordamerika-Boreal', [
      [-140, 60], [-120, 62], [-90, 58], [-70, 54], [-65, 50],
      [-80, 48], [-100, 52], [-120, 54], [-140, 56], [-140, 60],
    ]),
    poly('forest', 'Ostusa-Wald', [
      [-92, 48], [-75, 46], [-70, 40], [-80, 34], [-90, 36], [-95, 42], [-92, 48],
    ]),
    poly('forest', 'Mitteleuropa', [
      [-5, 52], [10, 54], [20, 52], [22, 46], [10, 44], [0, 46], [-5, 52],
    ]),
    poly('forest', 'Südostasien', [
      [95, 22], [108, 20], [118, 10], [120, 2], [110, -2], [100, 4], [95, 14], [95, 22],
    ]),
    poly('forest', 'Ostasien', [
      [110, 42], [130, 40], [140, 35], [135, 30], [120, 28], [110, 35], [110, 42],
    ]),
    poly('forest', 'Indien-Monsun', [
      [72, 28], [85, 26], [90, 22], [85, 12], [75, 10], [72, 20], [72, 28],
    ]),
    poly('forest', 'Neuseeland', [
      [166, -38], [175, -36], [178, -40], [172, -46], [167, -44], [166, -38],
    ]),
    poly('forest', 'Patagonien-Wald', [
      [-75, -40], [-72, -42], [-71, -48], [-73, -52], [-76, -48], [-75, -40],
    ]),

    // —— Wüsten ——
    poly('desert', 'Sahara', [
      [-16, 32], [0, 34], [15, 33], [32, 30], [36, 22], [30, 14],
      [10, 15], [-5, 17], [-14, 22], [-16, 32],
    ]),
    poly('desert', 'Arabien', [
      [35, 32], [48, 30], [58, 25], [55, 16], [44, 14], [38, 20], [35, 32],
    ]),
    poly('desert', 'Gobi', [
      [88, 46], [112, 45], [118, 41], [110, 37], [92, 39], [88, 46],
    ]),
    poly('desert', 'Taklamakan', [
      [78, 42], [90, 41], [92, 37], [82, 36], [78, 40], [78, 42],
    ]),
    poly('desert', 'Thar', [
      [68, 30], [75, 30], [76, 25], [70, 24], [68, 28], [68, 30],
    ]),
    poly('desert', 'Australien', [
      [114, -22], [132, -20], [142, -24], [138, -33], [122, -33], [114, -28], [114, -22],
    ]),
    poly('desert', 'Atacama', [
      [-72, -16], [-68, -18], [-68, -28], [-71, -32], [-72, -24], [-72, -16],
    ]),
    poly('desert', 'Patagonien-Trocken', [
      [-70, -40], [-65, -42], [-66, -50], [-70, -48], [-72, -44], [-70, -40],
    ]),
    poly('desert', 'Kalahari', [
      [14, -22], [26, -22], [27, -29], [20, -32], [14, -28], [14, -22],
    ]),
    poly('desert', 'Namib', [
      [12, -18], [16, -20], [16, -28], [13, -30], [11, -24], [12, -18],
    ]),
    poly('desert', 'Iran-Hochland', [
      [48, 34], [60, 32], [62, 27], [54, 25], [48, 30], [48, 34],
    ]),
    poly('desert', 'Sonora-Chihuahua', [
      [-115, 35], [-105, 34], [-103, 28], [-110, 26], [-115, 30], [-115, 35],
    ]),

    // —— Gebirge ——
    line('mountain', 'Anden', [
      [-75, 10], [-77, 2], [-78, -10], [-72, -20], [-70, -30], [-72, -40], [-70, -50], [-68, -55],
    ]),
    line('mountain', 'Rocky Mountains', [
      [-122, 60], [-118, 55], [-115, 48], [-112, 42], [-108, 36], [-106, 32], [-104, 28],
    ]),
    line('mountain', 'Sierra Madre', [
      [-108, 30], [-105, 25], [-100, 20], [-97, 17],
    ]),
    line('mountain', 'Appalachen', [
      [-82, 44], [-81, 38], [-82, 34], [-84, 32],
    ]),
    line('mountain', 'Himalaya', [
      [72, 35], [78, 34], [85, 29], [92, 28], [98, 28], [102, 30],
    ]),
    line('mountain', 'Karakorum-Hindukusch', [
      [68, 36], [72, 36], [76, 35], [78, 34],
    ]),
    line('mountain', 'Alpen', [
      [5, 45], [7, 46], [10, 47], [13, 47], [15, 46],
    ]),
    line('mountain', 'Pyrenäen', [
      [-2, 43], [0, 42.5], [2, 42.5],
    ]),
    line('mountain', 'Karpaten', [
      [18, 49], [22, 48], [26, 46], [25, 45],
    ]),
    line('mountain', 'Kaukasus', [
      [40, 43], [43, 43], [46, 42], [48, 41],
    ]),
    line('mountain', 'Ural', [
      [60, 68], [60, 60], [58, 55], [58, 50], [60, 48],
    ]),
    line('mountain', 'Altai-Sajan', [
      [85, 50], [90, 48], [98, 52], [105, 54],
    ]),
    line('mountain', 'Tian Shan', [
      [72, 42], [78, 42], [85, 42], [90, 43],
    ]),
    line('mountain', 'Atlas', [
      [-8, 32], [-4, 33], [0, 34], [5, 34],
    ]),
    line('mountain', 'Drakensberge', [
      [27, -25], [29, -28], [30, -31],
    ]),
    line('mountain', 'Great Dividing Range', [
      [148, -18], [150, -26], [149, -34], [147, -38],
    ]),
    line('mountain', 'Skanden', [
      [5, 60], [8, 64], [12, 68], [16, 69], [20, 70],
    ]),
    line('mountain', 'Japanische Alpen', [
      [136, 36], [138, 36], [139, 37],
    ]),
    line('mountain', 'Neuguinea-Hochland', [
      [140, -4], [145, -5], [148, -6],
    ]),
  ],
}

function poly(kind: LandscapeKind, name: string, ring: [number, number][]): LandscapeFeature {
  return {
    type: 'Feature',
    properties: { kind, name },
    geometry: { type: 'Polygon', coordinates: [ring] },
  }
}

function line(kind: LandscapeKind, name: string, coords: [number, number][]): LandscapeFeature {
  return {
    type: 'Feature',
    properties: { kind, name },
    geometry: { type: 'MultiLineString', coordinates: [coords] },
  }
}
