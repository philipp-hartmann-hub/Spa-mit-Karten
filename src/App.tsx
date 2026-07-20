import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  WorldMap,
  countryLabel,
  getPlayableCountries,
  normalizeId,
  type CountryFeature,
} from './WorldMap'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'
import {
  CONTINENT_OPTIONS,
  matchesContinent,
  type ContinentFilter,
} from './continents'
import { capitalOf, hasCapital } from './capitals'
import { countryFlagUrl, hasCountryFlag, hasRegionFlag, regionFlagUrl } from './flags'
import { hasRegionCapital, regionCapitalOf } from './regionCapitals'
import {
  countriesWithRegionCapitals,
  countriesWithRegions,
  loadRegions,
  regionLabel,
  regionsForCountry,
  regionsWithCapitals,
  type RegionFeature,
} from './admin1'
import {
  citiesForCountry,
  cityLabel,
  countriesWithCities,
  loadCities,
  type CityFeature,
} from './cities'
import {
  MODE_OPTIONS,
  REGION_QUIZ_OPTIONS,
  type GameMode,
  type RegionQuiz,
} from './gameModes'
import { ModeIcon } from './ModeIcon'
import './App.css'

type Phase = 'intro' | 'setup' | 'playing' | 'reveal'
type Feedback = 'idle' | 'correct' | 'wrong'

type WorldTopology = Topology<{ countries: GeometryCollection }>

function pickRandom<T>(pool: T[], exclude?: ((item: T) => boolean) | null): T {
  const filtered = exclude ? pool.filter((item) => !exclude(item)) : pool
  const list = filtered.length > 0 ? filtered : pool
  return list[Math.floor(Math.random() * list.length)]!
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [mode, setMode] = useState<GameMode>('country')
  const [allCountries, setAllCountries] = useState<CountryFeature[]>([])
  const [regionReady, setRegionReady] = useState(false)
  const [citiesReady, setCitiesReady] = useState(false)
  const [continent, setContinent] = useState<ContinentFilter>('all')
  const [regionCountryId, setRegionCountryId] = useState<string>('')
  const [regionQuiz, setRegionQuiz] = useState<RegionQuiz>('name')
  const [target, setTarget] = useState<CountryFeature | null>(null)
  const [targetRegion, setTargetRegion] = useState<RegionFeature | null>(null)
  const [targetCity, setTargetCity] = useState<CityFeature | null>(null)
  const [zoomCountry, setZoomCountry] = useState<CountryFeature | null>(null)
  const [activeRegions, setActiveRegions] = useState<RegionFeature[]>([])
  const [activeCities, setActiveCities] = useState<CityFeature[]>([])
  const [feedback, setFeedback] = useState<Feedback>('idle')
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [round, setRound] = useState(0)
  const [message, setMessage] = useState('')
  const roundTimer = useRef<number | null>(null)
  const modeRef = useRef<GameMode>(mode)
  const regionQuizRef = useRef<RegionQuiz>(regionQuiz)

  const clearRoundTimer = () => {
    if (roundTimer.current !== null) {
      window.clearTimeout(roundTimer.current)
      roundTimer.current = null
    }
  }

  useEffect(() => {
    fetch('/countries-110m.json')
      .then((r) => r.json())
      .then((topo: WorldTopology) => {
        const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>
        setAllCountries(getPlayableCountries(fc.features as CountryFeature[]))
      })
  }, [])

  useEffect(() => {
    loadRegions()
      .then(() => setRegionReady(true))
      .catch((err) => console.error('Regionen konnten nicht geladen werden', err))
  }, [])

  useEffect(() => {
    loadCities()
      .then(() => setCitiesReady(true))
      .catch((err) => console.error('Städte konnten nicht geladen werden', err))
  }, [])

  useEffect(() => () => clearRoundTimer(), [])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    regionQuizRef.current = regionQuiz
  }, [regionQuiz])

  const regionCountryIds = useMemo(
    () => new Set(regionReady ? countriesWithRegions() : []),
    [regionReady],
  )

  const regionCapitalCountryIds = useMemo(
    () => new Set(regionReady ? countriesWithRegionCapitals(hasRegionCapital) : []),
    [regionReady],
  )

  const regionFlagCountryIds = useMemo(
    () => new Set(regionReady ? countriesWithRegionCapitals(hasRegionFlag) : []),
    [regionReady],
  )

  const cityCountryIds = useMemo(
    () => new Set(citiesReady ? countriesWithCities(3) : []),
    [citiesReady],
  )

  const pool = useMemo(() => {
    const byContinent = allCountries.filter((c) =>
      matchesContinent(normalizeId(c.id), continent),
    )
    if (mode === 'capital') {
      return byContinent.filter((c) => hasCapital(normalizeId(c.id)))
    }
    if (mode === 'flag') {
      return byContinent.filter((c) => hasCountryFlag(normalizeId(c.id)))
    }
    if (mode === 'cities') {
      return byContinent.filter((c) => cityCountryIds.has(normalizeId(c.id)))
    }
    if (mode === 'regions') {
      const allowed =
        regionQuiz === 'capital'
          ? regionCapitalCountryIds
          : regionQuiz === 'flag'
            ? regionFlagCountryIds
            : regionCountryIds
      return byContinent.filter((c) => allowed.has(normalizeId(c.id)))
    }
    return byContinent
  }, [
    allCountries,
    continent,
    mode,
    regionCountryIds,
    regionCapitalCountryIds,
    regionFlagCountryIds,
    cityCountryIds,
    regionQuiz,
  ])

  const regionCountryOptions = useMemo(() => {
    return [...pool]
      .map((c) => ({
        id: normalizeId(c.id),
        label: countryLabel(c),
        feature: c,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de'))
  }, [pool])

  const needsCountryPick = mode === 'regions' || mode === 'cities'

  useEffect(() => {
    if (!needsCountryPick) return
    if (regionCountryOptions.length === 0) {
      if (regionCountryId) setRegionCountryId('')
      return
    }
    const stillValid = regionCountryOptions.some((o) => o.id === regionCountryId)
    if (!stillValid) {
      setRegionCountryId(regionCountryOptions[0]!.id)
    }
  }, [needsCountryPick, regionCountryOptions, regionCountryId])

  const activeIds = useMemo(
    () => new Set(pool.map((c) => normalizeId(c.id))),
    [pool],
  )

  const selectedRegionCountry = useMemo(() => {
    if (!regionCountryId) return null
    return allCountries.find((c) => normalizeId(c.id) === regionCountryId) ?? null
  }, [allCountries, regionCountryId])

  const startCountryRound = useCallback(
    (fromPool: CountryFeature[], previousId?: string | null) => {
      if (fromPool.length === 0) return
      clearRoundTimer()
      const next = pickRandom(fromPool, previousId ? (c) => normalizeId(c.id) === previousId : null)
      setZoomCountry(null)
      setActiveRegions([])
      setActiveCities([])
      setTargetRegion(null)
      setTargetCity(null)
      setTarget(next)
      setFeedback('idle')
      setWrongId(null)
      setMessage('')
      setPhase('playing')
      setRound((r) => r + 1)
    },
    [],
  )

  const startCityRound = useCallback(
    (country: CountryFeature, previousId?: string | null) => {
      const countryId = normalizeId(country.id)
      const cities = citiesForCountry(countryId)
      if (cities.length === 0) return
      clearRoundTimer()
      const city = pickRandom(
        cities,
        previousId ? (c) => c.properties.id === previousId : null,
      )
      setZoomCountry(country)
      setActiveRegions(regionsForCountry(countryId))
      setActiveCities(cities)
      setTarget(country)
      setTargetRegion(null)
      setTargetCity(city)
      setFeedback('idle')
      setWrongId(null)
      setMessage('')
      setPhase('playing')
      setRound((r) => r + 1)
    },
    [],
  )

  const startRegionRound = useCallback(
    (country: CountryFeature, previousId?: string | null) => {
      const countryId = normalizeId(country.id)
      const allRegions = regionsForCountry(countryId)
      const quiz = regionQuizRef.current

      const quizPool =
        quiz === 'capital'
          ? regionsWithCapitals(countryId, hasRegionCapital)
          : quiz === 'flag'
            ? regionsWithCapitals(countryId, hasRegionFlag)
            : allRegions
      if (quizPool.length === 0) return
      clearRoundTimer()
      const region = pickRandom(
        quizPool,
        previousId ? (r) => r.properties.id === previousId : null,
      )

      setZoomCountry(country)
      setActiveRegions(allRegions)
      setActiveCities([])
      setTarget(country)
      setTargetRegion(region)
      setTargetCity(null)
      setFeedback('idle')
      setWrongId(null)
      setMessage('')
      setPhase('playing')
      setRound((r) => r + 1)
    },
    [],
  )

  const startRound = useCallback(
    (fromPool: CountryFeature[], previousId?: string | null) => {
      if (modeRef.current === 'regions' || modeRef.current === 'cities') {
        const country =
          fromPool.find((c) => normalizeId(c.id) === regionCountryId) ?? fromPool[0]
        if (!country) return
        if (modeRef.current === 'cities') {
          startCityRound(country, previousId)
        } else {
          startRegionRound(country, previousId)
        }
      } else {
        startCountryRound(fromPool, previousId)
      }
    },
    [startCountryRound, startRegionRound, startCityRound, regionCountryId],
  )

  const scheduleNextRound = (fromPool: CountryFeature[], previousId: string, delay: number) => {
    clearRoundTimer()
    roundTimer.current = window.setTimeout(() => startRound(fromPool, previousId), delay)
  }

  const rebuildPool = (
    nextContinent: ContinentFilter,
    nextMode: GameMode,
    nextQuiz: RegionQuiz = regionQuiz,
  ) => {
    const byContinent = allCountries.filter((c) =>
      matchesContinent(normalizeId(c.id), nextContinent),
    )
    if (nextMode === 'capital') {
      return byContinent.filter((c) => hasCapital(normalizeId(c.id)))
    }
    if (nextMode === 'flag') {
      return byContinent.filter((c) => hasCountryFlag(normalizeId(c.id)))
    }
    if (nextMode === 'cities') {
      return byContinent.filter((c) => cityCountryIds.has(normalizeId(c.id)))
    }
    if (nextMode === 'regions') {
      const allowed =
        nextQuiz === 'capital'
          ? regionCapitalCountryIds
          : nextQuiz === 'flag'
            ? regionFlagCountryIds
            : regionCountryIds
      return byContinent.filter((c) => allowed.has(normalizeId(c.id)))
    }
    return byContinent
  }

  const resetAndStart = (nextPool: CountryFeature[]) => {
    clearRoundTimer()
    setScore(0)
    setStreak(0)
    setRound(0)
    setFeedback('idle')
    setWrongId(null)
    setMessage('')
    if (nextPool.length === 0) {
      setTarget(null)
      setTargetRegion(null)
      setTargetCity(null)
      setZoomCountry(null)
      setActiveRegions([])
      setActiveCities([])
      setPhase('intro')
      return
    }
    startRound(nextPool)
  }

  const beginGame = () => {
    if (pool.length === 0) return
    if (needsCountryPick && !selectedRegionCountry) return
    clearRoundTimer()
    setScore(0)
    setStreak(0)
    setRound(0)
    startRound(pool)
  }

  const openSetup = (next: GameMode) => {
    setMode(next)
    setZoomCountry(null)
    setActiveRegions([])
    setActiveCities([])
    setTarget(null)
    setTargetRegion(null)
    setTargetCity(null)
    setFeedback('idle')
    setWrongId(null)
    setMessage('')
    setPhase('setup')
  }

  const backToIntro = () => {
    clearRoundTimer()
    setZoomCountry(null)
    setActiveRegions([])
    setActiveCities([])
    setTarget(null)
    setTargetRegion(null)
    setTargetCity(null)
    setFeedback('idle')
    setWrongId(null)
    setMessage('')
    setPhase('intro')
  }

  const changeRegionCountry = (nextId: string) => {
    setRegionCountryId(nextId)
    if (phase === 'intro' || phase === 'setup' || !needsCountryPick) return

    const country = allCountries.find((c) => normalizeId(c.id) === nextId)
    if (!country) return

    clearRoundTimer()
    setScore(0)
    setStreak(0)
    setRound(0)
    setFeedback('idle')
    setWrongId(null)
    setMessage('')
    if (mode === 'cities') {
      startCityRound(country)
    } else {
      startRegionRound(country)
    }
  }

  const changeRegionQuiz = (next: RegionQuiz) => {
    setRegionQuiz(next)
    regionQuizRef.current = next
    if (phase === 'intro' || phase === 'setup' || mode !== 'regions') return
    resetAndStart(rebuildPool(continent, mode, next))
  }

  const changeContinent = (next: ContinentFilter) => {
    setContinent(next)
    if (phase === 'intro' || phase === 'setup') return
    resetAndStart(rebuildPool(next, mode))
  }

  const changeMode = (next: GameMode) => {
    setMode(next)
    if (phase === 'intro' || phase === 'setup') return
    resetAndStart(rebuildPool(continent, next))
  }

  const onSelect = (id: string) => {
    if (phase !== 'playing') return
    const currentMode = modeRef.current

    if (currentMode === 'cities') {
      if (!targetCity || !target) return
      const targetCityId = targetCity.properties.id
      const countryName = countryLabel(target)
      const targetName = cityLabel(targetCity)

      if (id === targetCityId) {
        setFeedback('correct')
        setScore((s) => s + 1)
        setStreak((s) => s + 1)
        setMessage(`Treffer! ${targetName} (${countryName})`)
        setPhase('reveal')
        scheduleNextRound(pool, targetCityId, 1200)
        return
      }

      const clicked = activeCities.find((c) => c.properties.id === id)
      setFeedback('wrong')
      setWrongId(id)
      setStreak(0)
      setMessage(
        clicked
          ? `Das war ${cityLabel(clicked)} — gesucht: ${targetName}`
          : `Leider daneben — gesucht: ${targetName}`,
      )
      setPhase('reveal')
      scheduleNextRound(pool, targetCityId, 2000)
      return
    }

    if (currentMode === 'regions') {
      if (!targetRegion || !target) return
      const targetRegionId = targetRegion.properties.id
      const countryName = countryLabel(target)
      const quiz = regionQuizRef.current
      const targetCap = regionCapitalOf(targetRegionId)
      const targetName = regionLabel(targetRegion)

      if (id === targetRegionId) {
        setFeedback('correct')
        setScore((s) => s + 1)
        setStreak((s) => s + 1)
        setMessage(
          quiz === 'capital' && targetCap
            ? `Treffer! ${targetCap} → ${targetName} (${countryName})`
            : `Treffer! ${targetName} (${countryName})`,
        )
        setPhase('reveal')
        scheduleNextRound(pool, targetRegionId, 1200)
        return
      }

      const clicked = activeRegions.find((r) => r.properties.id === id)
      const clickedCap = clicked ? regionCapitalOf(clicked.properties.id) : null
      setFeedback('wrong')
      setWrongId(id)
      setStreak(0)

      if (quiz === 'capital' && targetCap) {
        setMessage(
          clicked
            ? `Das war ${regionLabel(clicked)}${clickedCap ? ` (${clickedCap})` : ''} — gesucht: ${targetCap} → ${targetName}`
            : `Leider daneben — gesucht: ${targetCap} → ${targetName}`,
        )
      } else {
        setMessage(
          clicked
            ? `Das war ${regionLabel(clicked)} — gesucht: ${targetName}`
            : `Leider daneben — gesucht: ${targetName}`,
        )
      }
      setPhase('reveal')
      scheduleNextRound(pool, targetRegionId, 2000)
      return
    }

    if (!target) return
    if (!activeIds.has(id)) return

    const targetId = normalizeId(target.id)
    const targetCapital = capitalOf(targetId)
    const targetCountry = countryLabel(target)

    if (id === targetId) {
      setFeedback('correct')
      setScore((s) => s + 1)
      setStreak((s) => s + 1)
      setMessage(
        currentMode === 'capital' && targetCapital
          ? `Treffer! ${targetCapital} → ${targetCountry}`
          : currentMode === 'flag'
            ? `Treffer! ${targetCountry}`
            : 'Treffer!',
      )
      setPhase('reveal')
      scheduleNextRound(pool, targetId, 1100)
      return
    }

    const clicked = allCountries.find((c) => normalizeId(c.id) === id)
    const clickedLabel = clicked ? countryLabel(clicked) : null
    const clickedCapital = clicked ? capitalOf(normalizeId(clicked.id)) : null

    setFeedback('wrong')
    setWrongId(id)
    setStreak(0)

    if (currentMode === 'capital' && targetCapital) {
      setMessage(
        clickedLabel
          ? `Das war ${clickedLabel}${clickedCapital ? ` (${clickedCapital})` : ''} — gesucht: ${targetCapital} → ${targetCountry}`
          : `Leider daneben — gesucht: ${targetCapital} → ${targetCountry}`,
      )
    } else if (currentMode === 'flag') {
      setMessage(
        clickedLabel
          ? `Das war ${clickedLabel} — gesucht: ${targetCountry}`
          : `Leider daneben — gesucht: ${targetCountry}`,
      )
    } else {
      setMessage(
        clickedLabel
          ? `Das war ${clickedLabel} — gesucht: ${targetCountry}`
          : `Leider daneben — gesucht: ${targetCountry}`,
      )
    }

    setPhase('reveal')
    scheduleNextRound(pool, targetId, 1800)
  }

  const targetId = target ? normalizeId(target.id) : null
  const targetCountry = target ? countryLabel(target) : ''
  const targetCapital = targetId ? capitalOf(targetId) : null
  const targetRegionName = targetRegion ? regionLabel(targetRegion) : ''
  const targetRegionCapital = targetRegion
    ? regionCapitalOf(targetRegion.properties.id)
    : null
  const targetCityName = targetCity ? cityLabel(targetCity) : ''
  const showCountryFlag = mode === 'flag' && phase !== 'intro'
  const showRegionFlag = mode === 'regions' && regionQuiz === 'flag' && phase !== 'intro'
  const promptFlagUrl = showRegionFlag
    ? targetRegion
      ? regionFlagUrl(targetRegion.properties.id)
      : null
    : showCountryFlag && targetId
      ? countryFlagUrl(targetId)
      : null

  const promptLabel =
    mode === 'capital'
      ? 'Hauptstadt von welchem Land?'
      : mode === 'flag'
        ? 'Welche Flagge ist das?'
        : mode === 'cities'
          ? `Wo liegt in ${targetCountry || '…'}?`
          : mode === 'regions'
            ? regionQuiz === 'capital'
              ? `Hauptstadt in ${targetCountry || '…'}?`
              : regionQuiz === 'flag'
                ? `Welche Flagge in ${targetCountry || '…'}?`
                : `Finde in ${targetCountry || '…'}`
            : 'Finde'

  const promptValue =
    mode === 'capital'
      ? (targetCapital ?? targetCountry)
      : mode === 'flag'
        ? null
        : mode === 'cities'
          ? targetCityName
          : mode === 'regions'
            ? regionQuiz === 'capital'
              ? (targetRegionCapital ?? targetRegionName)
              : regionQuiz === 'flag'
                ? null
                : targetRegionName
            : targetCountry

  const continentLabel =
    CONTINENT_OPTIONS.find((o) => o.id === continent)?.label ?? 'Welt'
  const modeMeta = MODE_OPTIONS.find((m) => m.id === mode)!
  const loadingData =
    (mode === 'regions' && !regionReady) || (mode === 'cities' && !citiesReady)

  const regionQuizPicker =
    mode === 'regions' ? (
      <fieldset className="mode-picker region-quiz-picker">
        <legend className="filter-label">Aufgabe</legend>
        <div className="mode-options mode-options-3" role="radiogroup" aria-label="Regionsaufgabe">
          {REGION_QUIZ_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={regionQuiz === opt.id}
              className={`mode-option ${regionQuiz === opt.id ? 'is-active' : ''}`}
              onClick={() => {
                if (phase === 'setup') {
                  setRegionQuiz(opt.id)
                  regionQuizRef.current = opt.id
                } else {
                  changeRegionQuiz(opt.id)
                }
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>
    ) : null

  const regionCountrySelect = (compact: boolean) =>
    needsCountryPick ? (
      <label className={`filter ${compact ? 'filter-compact' : ''}`}>
        <span className="filter-label">Land</span>
        <select
          className="filter-select"
          value={regionCountryId}
          onChange={(e) =>
            compact ? changeRegionCountry(e.target.value) : setRegionCountryId(e.target.value)
          }
          disabled={!compact && (loadingData || regionCountryOptions.length === 0)}
          aria-label={compact ? 'Land wechseln' : 'Land wählen'}
        >
          {regionCountryOptions.length === 0 ? (
            <option value="">Keine Länder verfügbar</option>
          ) : (
            regionCountryOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))
          )}
        </select>
      </label>
    ) : null

  const showHud = phase === 'playing' || phase === 'reveal'
  const showOrbit = phase === 'intro'
  const showSetup = phase === 'setup'
  const mapIdle = phase === 'intro' || phase === 'setup'
  const inGameMap = phase === 'playing' || phase === 'reveal'

  return (
    <div className={`app app-${phase}`}>
      <div className="atmosphere" aria-hidden />

      {showOrbit ? (
        <header className="intro intro-orbit">
          <p className="version">Version 1.0</p>
          <h1 className="brand">Spaß mit Karten</h1>
        </header>
      ) : null}

      {showSetup ? (
        <header className="setup">
          <button type="button" className="setup-back" onClick={backToIntro}>
            ← Modi
          </button>
          <h1 className="setup-title">{modeMeta.label}</h1>
          <p className="setup-hint">{modeMeta.hint}</p>

          {regionQuizPicker}

          <label className="filter">
            <span className="filter-label">Kontinent</span>
            <select
              className="filter-select"
              value={continent}
              onChange={(e) => setContinent(e.target.value as ContinentFilter)}
              aria-label="Optional nach Kontinent filtern"
            >
              {CONTINENT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {regionCountrySelect(false)}

          <button
            type="button"
            className="cta"
            onClick={beginGame}
            disabled={
              pool.length === 0 ||
              loadingData ||
              (needsCountryPick && !regionCountryId)
            }
          >
            {allCountries.length === 0 || loadingData
              ? 'Karte lädt …'
              : pool.length === 0
                ? 'Keine Einheiten'
                : needsCountryPick && selectedRegionCountry
                  ? `${countryLabel(selectedRegionCountry)} spielen`
                  : continent === 'all'
                    ? 'Loslegen'
                    : `${continentLabel} spielen`}
          </button>
        </header>
      ) : null}

      {showHud ? (
        <header className="hud">
          <div className="hud-left">
            <div className="hud-brand">Spaß mit Karten</div>
            <label className="filter filter-compact">
              <span className="filter-label">Modus</span>
              <select
                className="filter-select"
                value={mode}
                onChange={(e) => changeMode(e.target.value as GameMode)}
                aria-label="Spielmodus wechseln"
              >
                {MODE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            {mode === 'regions' ? (
              <label className="filter filter-compact">
                <span className="filter-label">Aufgabe</span>
                <select
                  className="filter-select"
                  value={regionQuiz}
                  onChange={(e) => changeRegionQuiz(e.target.value as RegionQuiz)}
                  aria-label="Regionsaufgabe wechseln"
                >
                  {REGION_QUIZ_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="filter filter-compact">
              <span className="filter-label">Kontinent</span>
              <select
                className="filter-select"
                value={continent}
                onChange={(e) => changeContinent(e.target.value as ContinentFilter)}
                aria-label="Optional nach Kontinent filtern"
              >
                {CONTINENT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            {regionCountrySelect(true)}
          </div>
          <div className="hud-prompt">
            <span className="prompt-label">{promptLabel}</span>
            {promptFlagUrl ? (
              <div className="prompt-flag-wrap">
                <img
                  key={promptFlagUrl}
                  className="prompt-flag"
                  src={promptFlagUrl}
                  alt="Gesuchte Flagge"
                  decoding="async"
                />
              </div>
            ) : promptValue ? (
              <h2 className="prompt-country">{promptValue}</h2>
            ) : (
              <h2 className="prompt-country">…</h2>
            )}
            {message ? <p className={`prompt-feedback is-${feedback}`}>{message}</p> : null}
          </div>
          <div className="hud-stats" aria-label="Spielstand">
            <div>
              <span className="stat-value">{score}</span>
              <span className="stat-label">Punkte</span>
            </div>
            <div>
              <span className="stat-value">{streak}</span>
              <span className="stat-label">Serie</span>
            </div>
            <div>
              <span className="stat-value">{round}</span>
              <span className="stat-label">Runde</span>
            </div>
          </div>
        </header>
      ) : null}

      <main
        className={`stage ${mapIdle ? 'stage-intro' : ''} ${showOrbit ? 'stage-orbit' : ''} ${showSetup ? 'stage-setup' : ''}`}
      >
        <div className={`globe-frame ${showOrbit ? 'globe-frame-orbit' : ''}`}>
          {showOrbit ? (
            <div className="mode-orbit" role="navigation" aria-label="Spielmodus wählen">
              {MODE_OPTIONS.map((opt, index) => {
                const angle = index * (360 / MODE_OPTIONS.length) - 90
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className="mode-orbit-item"
                    style={{ '--orbit-angle': `${angle}deg` } as CSSProperties}
                    onClick={() => openSetup(opt.id)}
                  >
                    <span className="mode-orbit-disc">
                      <ModeIcon id={opt.id} className="mode-orbit-icon" />
                    </span>
                    <span className="mode-orbit-label">{opt.shortLabel}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          <WorldMap
            targetId={inGameMap ? targetId : null}
            feedback={inGameMap ? feedback : 'idle'}
            wrongId={
              inGameMap && mode !== 'regions' && mode !== 'cities' ? wrongId : null
            }
            onSelect={onSelect}
            interactive={phase === 'playing'}
            autoRotate={mapIdle}
            activeIds={
              inGameMap && continent !== 'all' ? activeIds : null
            }
            focus={phase === 'intro' ? 'all' : continent}
            zoomCountry={
              inGameMap && (mode === 'regions' || mode === 'cities') ? zoomCountry : null
            }
            regions={
              inGameMap && (mode === 'regions' || mode === 'cities') ? activeRegions : null
            }
            targetRegionId={
              inGameMap && mode === 'regions' ? (targetRegion?.properties.id ?? null) : null
            }
            wrongRegionId={inGameMap && mode === 'regions' ? wrongId : null}
            cities={inGameMap && mode === 'cities' ? activeCities : null}
            targetCityId={
              inGameMap && mode === 'cities' ? (targetCity?.properties.id ?? null) : null
            }
            wrongCityId={inGameMap && mode === 'cities' ? wrongId : null}
            selectMode={
              !inGameMap
                ? 'country'
                : mode === 'cities'
                  ? 'city'
                  : mode === 'regions'
                    ? 'region'
                    : 'country'
            }
          />
        </div>
      </main>
    </div>
  )
}
