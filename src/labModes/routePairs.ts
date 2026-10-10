export type RoutePair = {
  id: string
  from: { name: { de: string; en: string; fr: string }; lonlat: [number, number] }
  to: { name: { de: string; en: string; fr: string }; lonlat: [number, number] }
}

/** Paare, bei denen Großkreis und Mercator-Gerade stark abweichen. */
export const ROUTE_PAIRS: RoutePair[] = [
  {
    id: 'fra-lax',
    from: { name: { de: 'Frankfurt', en: 'Frankfurt', fr: 'Francfort' }, lonlat: [8.6821, 50.1109] },
    to: { name: { de: 'Los Angeles', en: 'Los Angeles', fr: 'Los Angeles' }, lonlat: [-118.2437, 34.0522] },
  },
  {
    id: 'lon-tyo',
    from: { name: { de: 'London', en: 'London', fr: 'Londres' }, lonlat: [-0.1276, 51.5072] },
    to: { name: { de: 'Tokio', en: 'Tokyo', fr: 'Tokyo' }, lonlat: [139.6917, 35.6895] },
  },
  {
    id: 'mad-mnl',
    from: { name: { de: 'Madrid', en: 'Madrid', fr: 'Madrid' }, lonlat: [-3.7038, 40.4168] },
    to: { name: { de: 'Manila', en: 'Manila', fr: 'Manille' }, lonlat: [120.9842, 14.5995] },
  },
  {
    id: 'scl-syd',
    from: { name: { de: 'Santiago', en: 'Santiago', fr: 'Santiago' }, lonlat: [-70.6693, -33.4489] },
    to: { name: { de: 'Sydney', en: 'Sydney', fr: 'Sydney' }, lonlat: [151.2093, -33.8688] },
  },
  {
    id: 'nyc-hkg',
    from: { name: { de: 'New York', en: 'New York', fr: 'New York' }, lonlat: [-74.006, 40.7128] },
    to: { name: { de: 'Hongkong', en: 'Hong Kong', fr: 'Hong Kong' }, lonlat: [114.1694, 22.3193] },
  },
  {
    id: 'ber-sfo',
    from: { name: { de: 'Berlin', en: 'Berlin', fr: 'Berlin' }, lonlat: [13.405, 52.52] },
    to: { name: { de: 'San Francisco', en: 'San Francisco', fr: 'San Francisco' }, lonlat: [-122.4194, 37.7749] },
  },
  {
    id: 'par-sin',
    from: { name: { de: 'Paris', en: 'Paris', fr: 'Paris' }, lonlat: [2.3522, 48.8566] },
    to: { name: { de: 'Singapur', en: 'Singapore', fr: 'Singapour' }, lonlat: [103.8198, 1.3521] },
  },
  {
    id: 'ams-yvr',
    from: { name: { de: 'Amsterdam', en: 'Amsterdam', fr: 'Amsterdam' }, lonlat: [4.9041, 52.3676] },
    to: { name: { de: 'Vancouver', en: 'Vancouver', fr: 'Vancouver' }, lonlat: [-123.1207, 49.2827] },
  },
  {
    id: 'lis-rio',
    from: { name: { de: 'Lissabon', en: 'Lisbon', fr: 'Lisbonne' }, lonlat: [-9.1393, 38.7223] },
    to: { name: { de: 'Rio de Janeiro', en: 'Rio de Janeiro', fr: 'Rio de Janeiro' }, lonlat: [-43.1729, -22.9068] },
  },
  {
    id: 'cai-jnb',
    from: { name: { de: 'Kairo', en: 'Cairo', fr: 'Le Caire' }, lonlat: [31.2357, 30.0444] },
    to: { name: { de: 'Johannesburg', en: 'Johannesburg', fr: 'Johannesburg' }, lonlat: [28.0473, -26.2041] },
  },
  {
    id: 'dxb-syd',
    from: { name: { de: 'Dubai', en: 'Dubai', fr: 'Dubaï' }, lonlat: [55.2708, 25.2048] },
    to: { name: { de: 'Sydney', en: 'Sydney', fr: 'Sydney' }, lonlat: [151.2093, -33.8688] },
  },
  {
    id: 'bom-lhr',
    from: { name: { de: 'Mumbai', en: 'Mumbai', fr: 'Mumbai' }, lonlat: [72.8777, 19.076] },
    to: { name: { de: 'London', en: 'London', fr: 'Londres' }, lonlat: [-0.1276, 51.5072] },
  },
  {
    id: 'sea-pek',
    from: { name: { de: 'Seattle', en: 'Seattle', fr: 'Seattle' }, lonlat: [-122.3321, 47.6062] },
    to: { name: { de: 'Peking', en: 'Beijing', fr: 'Pékin' }, lonlat: [116.4074, 39.9042] },
  },
  {
    id: 'bsb-lis',
    from: { name: { de: 'Brasília', en: 'Brasília', fr: 'Brasília' }, lonlat: [-47.8825, -15.7942] },
    to: { name: { de: 'Lissabon', en: 'Lisbon', fr: 'Lisbonne' }, lonlat: [-9.1393, 38.7223] },
  },
  {
    id: 'cpt-per',
    from: { name: { de: 'Kapstadt', en: 'Cape Town', fr: 'Le Cap' }, lonlat: [18.4241, -33.9249] },
    to: { name: { de: 'Perth', en: 'Perth', fr: 'Perth' }, lonlat: [115.8605, -31.9505] },
  },
  {
    id: 'osl-anc',
    from: { name: { de: 'Oslo', en: 'Oslo', fr: 'Oslo' }, lonlat: [10.7522, 59.9139] },
    to: { name: { de: 'Anchorage', en: 'Anchorage', fr: 'Anchorage' }, lonlat: [-149.9003, 61.2181] },
  },
  {
    id: 'ath-jfk',
    from: { name: { de: 'Athen', en: 'Athens', fr: 'Athènes' }, lonlat: [23.7275, 37.9838] },
    to: { name: { de: 'New York', en: 'New York', fr: 'New York' }, lonlat: [-74.006, 40.7128] },
  },
  {
    id: 'ist-bkk',
    from: { name: { de: 'Istanbul', en: 'Istanbul', fr: 'Istanbul' }, lonlat: [28.9784, 41.0082] },
    to: { name: { de: 'Bangkok', en: 'Bangkok', fr: 'Bangkok' }, lonlat: [100.5018, 13.7563] },
  },
  {
    id: 'mex-mad',
    from: { name: { de: 'Mexiko-Stadt', en: 'Mexico City', fr: 'Mexico' }, lonlat: [-99.1332, 19.4326] },
    to: { name: { de: 'Madrid', en: 'Madrid', fr: 'Madrid' }, lonlat: [-3.7038, 40.4168] },
  },
  {
    id: 'waw-ord',
    from: { name: { de: 'Warschau', en: 'Warsaw', fr: 'Varsovie' }, lonlat: [21.0122, 52.2297] },
    to: { name: { de: 'Chicago', en: 'Chicago', fr: 'Chicago' }, lonlat: [-87.6298, 41.8781] },
  },
  {
    id: 'vie-nrt',
    from: { name: { de: 'Wien', en: 'Vienna', fr: 'Vienne' }, lonlat: [16.3738, 48.2082] },
    to: { name: { de: 'Tokio', en: 'Tokyo', fr: 'Tokyo' }, lonlat: [139.6917, 35.6895] },
  },
  {
    id: 'zrh-gru',
    from: { name: { de: 'Zürich', en: 'Zurich', fr: 'Zurich' }, lonlat: [8.5417, 47.3769] },
    to: { name: { de: 'São Paulo', en: 'São Paulo', fr: 'São Paulo' }, lonlat: [-46.6333, -23.5505] },
  },
  {
    id: 'hel-kix',
    from: { name: { de: 'Helsinki', en: 'Helsinki', fr: 'Helsinki' }, lonlat: [24.9384, 60.1699] },
    to: { name: { de: 'Osaka', en: 'Osaka', fr: 'Osaka' }, lonlat: [135.5023, 34.6937] },
  },
  {
    id: 'dub-sfo',
    from: { name: { de: 'Dublin', en: 'Dublin', fr: 'Dublin' }, lonlat: [-6.2603, 53.3498] },
    to: { name: { de: 'San Francisco', en: 'San Francisco', fr: 'San Francisco' }, lonlat: [-122.4194, 37.7749] },
  },
  {
    id: 'bcn-eze',
    from: { name: { de: 'Barcelona', en: 'Barcelona', fr: 'Barcelone' }, lonlat: [2.1734, 41.3851] },
    to: { name: { de: 'Buenos Aires', en: 'Buenos Aires', fr: 'Buenos Aires' }, lonlat: [-58.3816, -34.6037] },
  },
  {
    id: 'muc-hnd',
    from: { name: { de: 'München', en: 'Munich', fr: 'Munich' }, lonlat: [11.582, 48.1351] },
    to: { name: { de: 'Tokio', en: 'Tokyo', fr: 'Tokyo' }, lonlat: [139.6917, 35.6895] },
  },
  {
    id: 'cph-yul',
    from: { name: { de: 'Kopenhagen', en: 'Copenhagen', fr: 'Copenhague' }, lonlat: [12.5683, 55.6761] },
    to: { name: { de: 'Montreal', en: 'Montreal', fr: 'Montréal' }, lonlat: [-73.5673, 45.5017] },
  },
  {
    id: 'prg-icn',
    from: { name: { de: 'Prag', en: 'Prague', fr: 'Prague' }, lonlat: [14.4378, 50.0755] },
    to: { name: { de: 'Seoul', en: 'Seoul', fr: 'Séoul' }, lonlat: [126.978, 37.5665] },
  },
  {
    id: 'bud-ord',
    from: { name: { de: 'Budapest', en: 'Budapest', fr: 'Budapest' }, lonlat: [19.0402, 47.4979] },
    to: { name: { de: 'Chicago', en: 'Chicago', fr: 'Chicago' }, lonlat: [-87.6298, 41.8781] },
  },
  {
    id: 'akl-lax',
    from: { name: { de: 'Auckland', en: 'Auckland', fr: 'Auckland' }, lonlat: [174.7633, -36.8485] },
    to: { name: { de: 'Los Angeles', en: 'Los Angeles', fr: 'Los Angeles' }, lonlat: [-118.2437, 34.0522] },
  },
]
