import { useEffect, useMemo, useState } from 'react'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'
import {
  LAB_MODE_UI_KEYS,
  type LabMode,
} from '../gameModes'
import {
  CONTINENT_OPTIONS,
  CONTINENT_UI_KEYS,
  matchesContinent,
  type ContinentFilter,
} from '../continents'
import { getPlayableCountries, normalizeId, type CountryFeature } from '../WorldMap'
import { LanguagePicker, useLocale } from '../i18n'
import { AreaMode } from './AreaMode'
import { DistanceMode } from './DistanceMode'
import { Antipode } from './Antipode'
import { Fits } from './Fits'
import type { FitsMetric } from './fitsLogic'
import { Route } from './Route'
import { Place } from './Place'
import type { PlaceDifficulty } from './placeLogic'
import { Puzzle } from './Puzzle'
import { DayNight } from './DayNight'
import { SplitMode, type SplitRoundKind } from './SplitMode'

type WorldTopology = Topology<{ countries: GeometryCollection }>

type Props = {
  mode: LabMode
  onExit: () => void
}

export function LabSession({ mode, onExit }: Props) {
  const { t } = useLocale()
  const keys = LAB_MODE_UI_KEYS[mode]
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [phase, setPhase] = useState<'setup' | 'play'>('setup')
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [continent, setContinent] = useState<ContinentFilter>(
    mode === 'puzzle' ? 'europe' : 'all',
  )
  const [fitsMetric, setFitsMetric] = useState<FitsMetric>('area')
  const [placeDiff, setPlaceDiff] = useState<PlaceDifficulty>('medium')
  const [antipodeMc, setAntipodeMc] = useState(false)
  const [dayWarmup, setDayWarmup] = useState(false)
  const [splitKind, setSplitKind] = useState<SplitRoundKind>('fixed')

  useEffect(() => {
    fetch('/countries-110m.json')
      .then((r) => r.json())
      .then((topo: WorldTopology) => {
        const fc = feature(topo, topo.objects.countries) as FeatureCollection<
          Geometry,
          { name: string }
        >
        setCountries(getPlayableCountries(fc.features as CountryFeature[]))
      })
  }, [])

  const pool = useMemo(() => {
    return countries.filter((c) => matchesContinent(normalizeId(c.id), continent))
  }, [countries, continent])

  const onScored = (points: number) => {
    setScore((s) => s + Math.round(points))
    setStreak((s) => (points > 40 ? s + 1 : 0))
  }

  const needsContinent =
    mode === 'puzzle' || mode === 'place' || mode === 'area' || mode === 'distance' || mode === 'fits' || mode === 'split'

  if (phase === 'setup') {
    return (
      <div className="app app-setup lab-session">
        <div className="atmosphere" aria-hidden />
        <header className="setup">
          <LanguagePicker className="lang-picker-setup" />
          <button type="button" className="setup-back" onClick={onExit}>
            {t('backModes')}
          </button>
          <p className="lab-group-label">{t('labGroup')}</p>
          <h1 className="setup-title">{t(keys.label)}</h1>
          <p className="setup-hint">{t(keys.hint)}</p>

          {needsContinent && mode !== 'split' ? (
            <label className="filter">
              <span className="filter-label">{t('continent')}</span>
              <select
                className="filter-select"
                value={continent}
                onChange={(e) => setContinent(e.target.value as ContinentFilter)}
              >
                {CONTINENT_OPTIONS.filter((o) => mode !== 'puzzle' || o.id !== 'all').map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {t(CONTINENT_UI_KEYS[opt.id])}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {mode === 'fits' ? (
            <label className="filter">
              <span className="filter-label">{t('labFitsMetric')}</span>
              <select
                className="filter-select"
                value={fitsMetric}
                onChange={(e) => setFitsMetric(e.target.value as FitsMetric)}
              >
                <option value="area">{t('fitsMetricArea')}</option>
                <option value="population">{t('fitsMetricPopulation')}</option>
              </select>
            </label>
          ) : null}

          {mode === 'place' ? (
            <label className="filter">
              <span className="filter-label">{t('labDifficulty')}</span>
              <select
                className="filter-select"
                value={placeDiff}
                onChange={(e) => setPlaceDiff(e.target.value as PlaceDifficulty)}
              >
                <option value="easy">{t('placeEasy')}</option>
                <option value="medium">{t('placeMedium')}</option>
                <option value="hard">{t('placeHard')}</option>
              </select>
            </label>
          ) : null}

          {mode === 'antipode' ? (
            <label className="filter filter-check">
              <input
                type="checkbox"
                checked={antipodeMc}
                onChange={(e) => setAntipodeMc(e.target.checked)}
              />
              <span>{t('labAntipodeMc')}</span>
            </label>
          ) : null}

          {mode === 'daynight' ? (
            <label className="filter filter-check">
              <input
                type="checkbox"
                checked={dayWarmup}
                onChange={(e) => setDayWarmup(e.target.checked)}
              />
              <span>{t('labDayNightWarmupToggle')}</span>
            </label>
          ) : null}

          {mode === 'split' ? (
            <label className="filter">
              <span className="filter-label">{t('labSplitKind')}</span>
              <select
                className="filter-select"
                value={splitKind}
                onChange={(e) => setSplitKind(e.target.value as SplitRoundKind)}
              >
                <option value="fixed">{t('labSplitFixed')}</option>
                <option value="anchor">{t('labSplitAnchor')}</option>
                <option value="free">{t('labSplitFree')}</option>
                <option value="world">{t('labSplitWorld')}</option>
              </select>
            </label>
          ) : null}

          <button
            type="button"
            className="cta"
            disabled={pool.length === 0 && mode !== 'daynight' && mode !== 'route' && splitKind !== 'world'}
            onClick={() => setPhase('play')}
          >
            {t('start')}
          </button>
        </header>
      </div>
    )
  }

  return (
    <div className="app app-playing lab-session">
      <div className="atmosphere" aria-hidden />
      <header className="hud">
        <div className="hud-left">
          <div className="hud-brand">{t('brand')}</div>
          <LanguagePicker />
          <button type="button" className="setup-back" onClick={onExit}>
            {t('backModes')}
          </button>
        </div>
        <div className="hud-stats" aria-label={t('ariaScore')}>
          <div>
            <span className="stat-value">{score}</span>
            <span className="stat-label">{t('points')}</span>
          </div>
          <div>
            <span className="stat-value">{streak}</span>
            <span className="stat-label">{t('streak')}</span>
          </div>
        </div>
      </header>
      <main className="stage lab-stage">
        {mode === 'area' ? <AreaMode countries={pool} onScored={onScored} /> : null}
        {mode === 'distance' ? <DistanceMode countries={pool} onScored={onScored} /> : null}
        {mode === 'antipode' ? (
          <Antipode countries={countries} bonusMc={antipodeMc} onScored={onScored} />
        ) : null}
        {mode === 'fits' ? (
          <Fits countries={pool.length ? pool : countries} metric={fitsMetric} onScored={onScored} />
        ) : null}
        {mode === 'route' ? <Route countries={countries} onScored={onScored} /> : null}
        {mode === 'place' ? (
          <Place countries={pool} difficulty={placeDiff} onScored={onScored} />
        ) : null}
        {mode === 'puzzle' ? <Puzzle countries={pool} continent={continent} /> : null}
        {mode === 'daynight' ? <DayNight warmup={dayWarmup} onScored={onScored} /> : null}
        {mode === 'split' ? (
          <SplitMode
            countries={pool.length ? pool : countries}
            kind={splitKind}
            onScored={(points) => onScored(points)}
          />
        ) : null}
      </main>
    </div>
  )
}
