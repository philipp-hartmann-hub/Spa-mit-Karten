export type GameMode = 'country' | 'capital' | 'flag' | 'regions' | 'cities' | 'blitz'

export type LabMode =
  | 'area'
  | 'distance'
  | 'antipode'
  | 'fits'
  | 'route'
  | 'place'
  | 'puzzle'
  | 'daynight'
  | 'split'

export type RegionQuiz = 'name' | 'capital' | 'flag'

export const MODE_OPTIONS: { id: GameMode }[] = [
  { id: 'country' },
  { id: 'capital' },
  { id: 'flag' },
  { id: 'regions' },
  { id: 'cities' },
  { id: 'blitz' },
]

export const LAB_MODE_OPTIONS: { id: LabMode }[] = [
  { id: 'area' },
  { id: 'distance' },
  { id: 'antipode' },
  { id: 'fits' },
  { id: 'route' },
  { id: 'place' },
  { id: 'puzzle' },
  { id: 'daynight' },
  { id: 'split' },
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

export const LAB_MODE_UI_KEYS: Record<
  LabMode,
  {
    label:
      | 'modeArea'
      | 'modeDistance'
      | 'modeAntipode'
      | 'modeFits'
      | 'modeRoute'
      | 'modePlace'
      | 'modePuzzle'
      | 'modeDayNight'
      | 'modeSplit'
    short:
      | 'modeAreaShort'
      | 'modeDistanceShort'
      | 'modeAntipodeShort'
      | 'modeFitsShort'
      | 'modeRouteShort'
      | 'modePlaceShort'
      | 'modePuzzleShort'
      | 'modeDayNightShort'
      | 'modeSplitShort'
    hint:
      | 'modeAreaHint'
      | 'modeDistanceHint'
      | 'modeAntipodeHint'
      | 'modeFitsHint'
      | 'modeRouteHint'
      | 'modePlaceHint'
      | 'modePuzzleHint'
      | 'modeDayNightHint'
      | 'modeSplitHint'
  }
> = {
  area: { label: 'modeArea', short: 'modeAreaShort', hint: 'modeAreaHint' },
  distance: { label: 'modeDistance', short: 'modeDistanceShort', hint: 'modeDistanceHint' },
  antipode: { label: 'modeAntipode', short: 'modeAntipodeShort', hint: 'modeAntipodeHint' },
  fits: { label: 'modeFits', short: 'modeFitsShort', hint: 'modeFitsHint' },
  route: { label: 'modeRoute', short: 'modeRouteShort', hint: 'modeRouteHint' },
  place: { label: 'modePlace', short: 'modePlaceShort', hint: 'modePlaceHint' },
  puzzle: { label: 'modePuzzle', short: 'modePuzzleShort', hint: 'modePuzzleHint' },
  daynight: { label: 'modeDayNight', short: 'modeDayNightShort', hint: 'modeDayNightHint' },
  split: { label: 'modeSplit', short: 'modeSplitShort', hint: 'modeSplitHint' },
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
