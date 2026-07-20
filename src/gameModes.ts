export type GameMode = 'country' | 'capital' | 'flag' | 'regions' | 'cities' | 'blitz'
export type RegionQuiz = 'name' | 'capital' | 'flag'

export const MODE_OPTIONS: {
  id: GameMode
  label: string
  shortLabel: string
  hint: string
}[] = [
  {
    id: 'country',
    label: 'Länder finden',
    shortLabel: 'Länder',
    hint: 'Ein Land wird genannt — finde es auf der Karte.',
  },
  {
    id: 'capital',
    label: 'Hauptstädte',
    shortLabel: 'Hauptstädte',
    hint: 'Eine Hauptstadt wird genannt — wähle das passende Land.',
  },
  {
    id: 'flag',
    label: 'Flaggen',
    shortLabel: 'Flaggen',
    hint: 'Eine Flagge wird gezeigt — wähle das passende Land auf der Karte.',
  },
  {
    id: 'regions',
    label: 'Regionen',
    shortLabel: 'Regionen',
    hint: 'Wähle ein Land — finde Regionen, Hauptstädte oder Flaggen.',
  },
  {
    id: 'cities',
    label: 'Städte',
    shortLabel: 'Städte',
    hint: 'Wähle ein Land — die größten Städte erscheinen als Punkte, ordne den Namen zu.',
  },
  {
    id: 'blitz',
    label: 'Stadt-Land-Fluss',
    shortLabel: 'Blitz',
    hint: '30 Sekunden: zum Buchstaben ein Land und eine Hauptstadt finden — und ein Land mit der Flaggenfarbe.',
  },
]

export const REGION_QUIZ_OPTIONS: { id: RegionQuiz; label: string }[] = [
  { id: 'name', label: 'Region finden' },
  { id: 'capital', label: 'Hauptstadt finden' },
  { id: 'flag', label: 'Flagge finden' },
]
