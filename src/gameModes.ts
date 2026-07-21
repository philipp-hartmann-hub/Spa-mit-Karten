export type GameMode = 'country' | 'capital' | 'flag' | 'regions' | 'cities' | 'blitz'
export type RegionQuiz = 'name' | 'capital' | 'flag'

export const MODE_OPTIONS: { id: GameMode }[] = [
  { id: 'country' },
  { id: 'capital' },
  { id: 'flag' },
  { id: 'regions' },
  { id: 'cities' },
  { id: 'blitz' },
]

export const MODE_UI_KEYS: Record<
  GameMode,
  { label: 'modeCountry' | 'modeCapital' | 'modeFlag' | 'modeRegions' | 'modeCities' | 'modeBlitz'; short: 'modeCountryShort' | 'modeCapitalShort' | 'modeFlagShort' | 'modeRegionsShort' | 'modeCitiesShort' | 'modeBlitzShort'; hint: 'modeCountryHint' | 'modeCapitalHint' | 'modeFlagHint' | 'modeRegionsHint' | 'modeCitiesHint' | 'modeBlitzHint' }
> = {
  country: { label: 'modeCountry', short: 'modeCountryShort', hint: 'modeCountryHint' },
  capital: { label: 'modeCapital', short: 'modeCapitalShort', hint: 'modeCapitalHint' },
  flag: { label: 'modeFlag', short: 'modeFlagShort', hint: 'modeFlagHint' },
  regions: { label: 'modeRegions', short: 'modeRegionsShort', hint: 'modeRegionsHint' },
  cities: { label: 'modeCities', short: 'modeCitiesShort', hint: 'modeCitiesHint' },
  blitz: { label: 'modeBlitz', short: 'modeBlitzShort', hint: 'modeBlitzHint' },
}

export const REGION_QUIZ_OPTIONS: { id: RegionQuiz }[] = [
  { id: 'name' },
  { id: 'capital' },
  { id: 'flag' },
]

export const REGION_QUIZ_UI_KEYS: Record<
  RegionQuiz,
  'regionQuizName' | 'regionQuizCapital' | 'regionQuizFlag'
> = {
  name: 'regionQuizName',
  capital: 'regionQuizCapital',
  flag: 'regionQuizFlag',
}
