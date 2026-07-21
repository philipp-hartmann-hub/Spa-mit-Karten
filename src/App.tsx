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
  CONTINENT_UI_KEYS,
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
  MODE_UI_KEYS,
  REGION_QUIZ_OPTIONS,
  REGION_QUIZ_UI_KEYS,
  type GameMode,
  type RegionQuiz,
} from './gameModes'
import {
  BLITZ_SECONDS,
  blitzComplete,
  blitzFilledCount,
  emptyBlitzAnswers,
  matchBlitzCategory,
  pickBlitzChallenge,
  type BlitzAnswers,
  type BlitzChallenge,
} from './blitz'
import { flagColorHex, flagColorLabelKey, flagColorsOf } from './flagColors'
import { ModeIcon } from './ModeIcon'
import { LanguagePicker, useLocale } from './i18n'
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
  const { locale, t } = useLocale()
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
  const [blitzChallenge, setBlitzChallenge] = useState<BlitzChallenge | null>(null)
  const [blitzAnswers, setBlitzAnswers] = useState<BlitzAnswers>(emptyBlitzAnswers())
  const [blitzSecondsLeft, setBlitzSecondsLeft] = useState(BLITZ_SECONDS)
  const roundTimer = useRef<number | null>(null)
  const blitzInterval = useRef<number | null>(null)
  const modeRef = useRef<GameMode>(mode)
  const regionQuizRef = useRef<RegionQuiz>(regionQuiz)
  const blitzAnswersRef = useRef(blitzAnswers)

  const clearRoundTimer = () => {
    if (roundTimer.current !== null) {
      window.clearTimeout(roundTimer.current)
      roundTimer.current = null
    }
  }

  const clearBlitzInterval = () => {
    if (blitzInterval.current !== null) {
      window.clearInterval(blitzInterval.current)
      blitzInterval.current = null
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

  useEffect(
    () => () => {
      clearRoundTimer()
      clearBlitzInterval()
    },
    [],
  )

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    regionQuizRef.current = regionQuiz
  }, [regionQuiz])

  useEffect(() => {
    blitzAnswersRef.current = blitzAnswers
  }, [blitzAnswers])

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
    if (mode === 'blitz') {
      return byContinent.filter((c) => {
        const id = normalizeId(c.id)
        return hasCapital(id) && flagColorsOf(id).length > 0
      })
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
        label: countryLabel(c, locale),
        feature: c,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, locale))
  }, [pool, locale])

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

  const finishBlitzRound = useCallback(
    (reason: 'complete' | 'timeout') => {
      clearBlitzInterval()
      clearRoundTimer()
      const filled = blitzFilledCount(blitzAnswersRef.current)
      setFeedback(filled === 3 ? 'correct' : filled > 0 ? 'correct' : 'wrong')
      setMessage(
        reason === 'complete'
          ? t('blitzAllFound', { n: filled })
          : filled > 0
            ? t('blitzTimePartial', { n: filled })
            : t('blitzTimeNone'),
      )
      if (filled === 3) {
        setStreak((s) => s + 1)
      } else if (reason === 'timeout' && filled === 0) {
        setStreak(0)
      }
      setPhase('reveal')
    },
    [t],
  )

  const startBlitzRound = useCallback(
    (fromPool: CountryFeature[]) => {
      if (fromPool.length === 0) return
      clearRoundTimer()
      clearBlitzInterval()
      const challenge = pickBlitzChallenge(fromPool, locale)
      if (!challenge) {
        setMessage(t('blitzNotEnough'))
        setPhase('setup')
        return
      }

      setZoomCountry(null)
      setActiveRegions([])
      setActiveCities([])
      setTargetRegion(null)
      setTargetCity(null)
      setTarget(null)
      setBlitzChallenge(challenge)
      setBlitzAnswers(emptyBlitzAnswers())
      blitzAnswersRef.current = emptyBlitzAnswers()
      setBlitzSecondsLeft(BLITZ_SECONDS)
      setFeedback('idle')
      setWrongId(null)
      setMessage('')
      setPhase('playing')
      setRound((r) => r + 1)

      let remaining = BLITZ_SECONDS
      blitzInterval.current = window.setInterval(() => {
        remaining -= 1
        setBlitzSecondsLeft(remaining)
        if (remaining <= 0) {
          finishBlitzRound('timeout')
        }
      }, 1000)
    },
    [finishBlitzRound, locale, t],
  )
  const startCountryRound = useCallback(
    (fromPool: CountryFeature[], previousId?: string | null) => {
      if (fromPool.length === 0) return
      clearRoundTimer()
      clearBlitzInterval()
      const next = pickRandom(fromPool, previousId ? (c) => normalizeId(c.id) === previousId : null)
      setZoomCountry(null)
      setActiveRegions([])
      setActiveCities([])
      setTargetRegion(null)
      setTargetCity(null)
      setTarget(next)
      setBlitzChallenge(null)
      setBlitzAnswers(emptyBlitzAnswers())
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
      clearBlitzInterval()
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
      setBlitzChallenge(null)
      setBlitzAnswers(emptyBlitzAnswers())
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
      clearBlitzInterval()
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
      setBlitzChallenge(null)
      setBlitzAnswers(emptyBlitzAnswers())
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
      if (modeRef.current === 'blitz') {
        startBlitzRound(fromPool)
        return
      }
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
    [startCountryRound, startRegionRound, startCityRound, startBlitzRound, regionCountryId],
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
    if (nextMode === 'blitz') {
      return byContinent.filter((c) => {
        const id = normalizeId(c.id)
        return hasCapital(id) && flagColorsOf(id).length > 0
      })
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
    clearBlitzInterval()
    setScore(0)
    setStreak(0)
    setRound(0)
    setFeedback('idle')
    setWrongId(null)
    setMessage('')
    setBlitzChallenge(null)
    setBlitzAnswers(emptyBlitzAnswers())
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
    clearBlitzInterval()
    setScore(0)
    setStreak(0)
    setRound(0)
    startRound(pool)
  }

  const openSetup = (next: GameMode) => {
    clearBlitzInterval()
    setMode(next)
    setZoomCountry(null)
    setActiveRegions([])
    setActiveCities([])
    setTarget(null)
    setTargetRegion(null)
    setTargetCity(null)
    setBlitzChallenge(null)
    setBlitzAnswers(emptyBlitzAnswers())
    setFeedback('idle')
    setWrongId(null)
    setMessage('')
    setPhase('setup')
  }

  const backToIntro = () => {
    clearRoundTimer()
    clearBlitzInterval()
    setZoomCountry(null)
    setActiveRegions([])
    setActiveCities([])
    setTarget(null)
    setTargetRegion(null)
    setTargetCity(null)
    setBlitzChallenge(null)
    setBlitzAnswers(emptyBlitzAnswers())
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

    if (currentMode === 'blitz') {
      if (!blitzChallenge || !activeIds.has(id)) return
      const feature = allCountries.find((c) => normalizeId(c.id) === id)
      if (!feature) return

      const alreadyUsed =
        blitzAnswers.country === id ||
        blitzAnswers.capital === id ||
        blitzAnswers.flag === id
      if (alreadyUsed) return

      const category = matchBlitzCategory(feature, blitzChallenge, blitzAnswers, locale)
      if (!category) {
        setFeedback('wrong')
        setWrongId(id)
        setStreak(0)
        setMessage(t('blitzNoMatch', { name: countryLabel(feature, locale) }))
        window.setTimeout(() => {
          setFeedback('idle')
          setWrongId(null)
          setMessage('')
        }, 900)
        return
      }

      const nextAnswers = { ...blitzAnswers, [category]: id }
      setBlitzAnswers(nextAnswers)
      blitzAnswersRef.current = nextAnswers
      setFeedback('correct')
      setWrongId(null)
      setScore((s) => s + 1)
      const categoryKey =
        category === 'country'
          ? 'slotCountry'
          : category === 'capital'
            ? 'slotCapital'
            : 'slotFlag'
      setMessage(
        t('blitzHit', {
          category: t(categoryKey),
          name: countryLabel(feature, locale),
        }),
      )

      if (blitzComplete(nextAnswers)) {
        finishBlitzRound('complete')
      } else {
        window.setTimeout(() => {
          setFeedback('idle')
          setMessage('')
        }, 700)
      }
      return
    }

    if (currentMode === 'cities') {
      if (!targetCity || !target) return
      const targetCityId = targetCity.properties.id
      const countryName = countryLabel(target, locale)
      const targetName = cityLabel(targetCity)

      if (id === targetCityId) {
        setFeedback('correct')
        setScore((s) => s + 1)
        setStreak((s) => s + 1)
        setMessage(t('hitCity', { city: targetName, country: countryName }))
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
          ? t('wrongCity', { clicked: cityLabel(clicked), target: targetName })
          : t('wrongCityMiss', { target: targetName }),
      )
      setPhase('reveal')
      scheduleNextRound(pool, targetCityId, 2000)
      return
    }

    if (currentMode === 'regions') {
      if (!targetRegion || !target) return
      const targetRegionId = targetRegion.properties.id
      const countryName = countryLabel(target, locale)
      const quiz = regionQuizRef.current
      const targetCap = regionCapitalOf(targetRegionId)
      const targetName = regionLabel(targetRegion)

      if (id === targetRegionId) {
        setFeedback('correct')
        setScore((s) => s + 1)
        setStreak((s) => s + 1)
        setMessage(
          quiz === 'capital' && targetCap
            ? t('hitRegionCapital', {
                capital: targetCap,
                region: targetName,
                country: countryName,
              })
            : t('hitRegion', { region: targetName, country: countryName }),
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
            ? t('wrongRegionCapital', {
                clicked: regionLabel(clicked),
                clickedCap: clickedCap ? ` (${clickedCap})` : '',
                capital: targetCap,
                region: targetName,
              })
            : t('wrongRegionMissCapital', {
                capital: targetCap,
                region: targetName,
              }),
        )
      } else {
        setMessage(
          clicked
            ? t('wrongRegion', {
                clicked: regionLabel(clicked),
                target: targetName,
              })
            : t('wrongRegionMiss', { target: targetName }),
        )
      }
      setPhase('reveal')
      scheduleNextRound(pool, targetRegionId, 2000)
      return
    }

    if (!target) return
    if (!activeIds.has(id)) return

    const targetId = normalizeId(target.id)
    const targetCapital = capitalOf(targetId, locale)
    const targetCountry = countryLabel(target, locale)

    if (id === targetId) {
      setFeedback('correct')
      setScore((s) => s + 1)
      setStreak((s) => s + 1)
      setMessage(
        currentMode === 'capital' && targetCapital
          ? t('hitCapital', { capital: targetCapital, country: targetCountry })
          : currentMode === 'flag'
            ? t('hitFlag', { country: targetCountry })
            : t('hit'),
      )
      setPhase('reveal')
      scheduleNextRound(pool, targetId, 1100)
      return
    }

    const clicked = allCountries.find((c) => normalizeId(c.id) === id)
    const clickedLabel = clicked ? countryLabel(clicked, locale) : null
    const clickedCapital = clicked ? capitalOf(normalizeId(clicked.id), locale) : null

    setFeedback('wrong')
    setWrongId(id)
    setStreak(0)

    if (currentMode === 'capital' && targetCapital) {
      setMessage(
        clickedLabel
          ? t('wrongCountryCapital', {
              clicked: clickedLabel,
              clickedCap: clickedCapital ? ` (${clickedCapital})` : '',
              capital: targetCapital,
              country: targetCountry,
            })
          : t('wrongMissCapital', {
              capital: targetCapital,
              country: targetCountry,
            }),
      )
    } else if (currentMode === 'flag') {
      setMessage(
        clickedLabel
          ? t('wrongCountry', { clicked: clickedLabel, target: targetCountry })
          : t('wrongMiss', { target: targetCountry }),
      )
    } else {
      setMessage(
        clickedLabel
          ? t('wrongCountry', { clicked: clickedLabel, target: targetCountry })
          : t('wrongMiss', { target: targetCountry }),
      )
    }

    setPhase('reveal')
    scheduleNextRound(pool, targetId, 1800)
  }

  const targetId = target ? normalizeId(target.id) : null
  const targetCountry = target ? countryLabel(target, locale) : ''
  const targetCapital = targetId ? capitalOf(targetId, locale) : null
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

  const blitzSlotLabel = (id: string | null) => {
    if (!id) return '—'
    const feature = allCountries.find((c) => normalizeId(c.id) === id)
    return feature ? countryLabel(feature, locale) : '—'
  }

  const promptLabel =
    mode === 'blitz'
      ? t('promptBlitz')
      : mode === 'capital'
        ? t('promptCapital')
        : mode === 'flag'
          ? t('promptFlag')
          : mode === 'cities'
            ? t('promptCity', { country: targetCountry || '…' })
            : mode === 'regions'
              ? regionQuiz === 'capital'
                ? t('promptRegionCapital', { country: targetCountry || '…' })
                : regionQuiz === 'flag'
                  ? t('promptRegionFlag', { country: targetCountry || '…' })
                  : t('promptRegion', { country: targetCountry || '…' })
              : t('promptFind')

  const promptValue =
    mode === 'blitz'
      ? null
      : mode === 'capital'
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

  const continentLabel = t(CONTINENT_UI_KEYS[continent])
  const modeKeys = MODE_UI_KEYS[mode]
  const loadingData =
    (mode === 'regions' && !regionReady) || (mode === 'cities' && !citiesReady)

  const regionQuizPicker =
    mode === 'regions' ? (
      <fieldset className="mode-picker region-quiz-picker">
        <legend className="filter-label">{t('task')}</legend>
        <div
          className="mode-options mode-options-3"
          role="radiogroup"
          aria-label={t('ariaRegionQuiz')}
        >
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
              {t(REGION_QUIZ_UI_KEYS[opt.id])}
            </button>
          ))}
        </div>
      </fieldset>
    ) : null

  const regionCountrySelect = (compact: boolean) =>
    needsCountryPick ? (
      <label className={`filter ${compact ? 'filter-compact' : ''}`}>
        <span className="filter-label">{t('country')}</span>
        <select
          className="filter-select"
          value={regionCountryId}
          onChange={(e) =>
            compact ? changeRegionCountry(e.target.value) : setRegionCountryId(e.target.value)
          }
          disabled={!compact && (loadingData || regionCountryOptions.length === 0)}
          aria-label={compact ? t('ariaCountryChange') : t('ariaCountryPick')}
        >
          {regionCountryOptions.length === 0 ? (
            <option value="">{t('noCountries')}</option>
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
          <LanguagePicker className="lang-picker-intro" />
          <p className="version">{t('version')}</p>
          <h1 className="brand">{t('brand')}</h1>
        </header>
      ) : null}

      {showSetup ? (
        <header className="setup">
          <LanguagePicker className="lang-picker-setup" />
          <button type="button" className="setup-back" onClick={backToIntro}>
            {t('backModes')}
          </button>
          <h1 className="setup-title">{t(modeKeys.label)}</h1>
          <p className="setup-hint">{t(modeKeys.hint)}</p>

          {mode === 'blitz' ? (
            <ul className="blitz-rules">
              <li>{t('blitzRuleCountry')}</li>
              <li>{t('blitzRuleCapital')}</li>
              <li>{t('blitzRuleFlag')}</li>
            </ul>
          ) : null}

          {regionQuizPicker}

          <label className="filter">
            <span className="filter-label">{t('continent')}</span>
            <select
              className="filter-select"
              value={continent}
              onChange={(e) => setContinent(e.target.value as ContinentFilter)}
              aria-label={t('ariaContinent')}
            >
              {CONTINENT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {t(CONTINENT_UI_KEYS[opt.id])}
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
              ? t('mapLoading')
              : pool.length === 0
                ? t('noUnits')
                : needsCountryPick && selectedRegionCountry
                  ? t('playCountry', {
                      country: countryLabel(selectedRegionCountry, locale),
                    })
                  : continent === 'all'
                    ? t('start')
                    : t('playContinent', { continent: continentLabel })}
          </button>
        </header>
      ) : null}

      {showHud ? (
        <header className="hud">
          <div className="hud-left">
            <div className="hud-brand">{t('brand')}</div>
            <LanguagePicker />
            <label className="filter filter-compact">
              <span className="filter-label">{t('mode')}</span>
              <select
                className="filter-select"
                value={mode}
                onChange={(e) => changeMode(e.target.value as GameMode)}
                aria-label={t('ariaMode')}
              >
                {MODE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {t(MODE_UI_KEYS[opt.id].label)}
                  </option>
                ))}
              </select>
            </label>
            {mode === 'regions' ? (
              <label className="filter filter-compact">
                <span className="filter-label">{t('task')}</span>
                <select
                  className="filter-select"
                  value={regionQuiz}
                  onChange={(e) => changeRegionQuiz(e.target.value as RegionQuiz)}
                  aria-label={t('ariaRegionQuizChange')}
                >
                  {REGION_QUIZ_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {t(REGION_QUIZ_UI_KEYS[opt.id])}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="filter filter-compact">
              <span className="filter-label">{t('continent')}</span>
              <select
                className="filter-select"
                value={continent}
                onChange={(e) => changeContinent(e.target.value as ContinentFilter)}
                aria-label={t('ariaContinent')}
              >
                {CONTINENT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {t(CONTINENT_UI_KEYS[opt.id])}
                  </option>
                ))}
              </select>
            </label>
            {regionCountrySelect(true)}
          </div>
          <div className="hud-prompt">
            <span className="prompt-label">{promptLabel}</span>
            {mode === 'blitz' && blitzChallenge ? (
              <>
                <div className="blitz-prompt">
                  <span
                    className="blitz-letter"
                    aria-label={t('ariaLetter', { letter: blitzChallenge.letter })}
                  >
                    {blitzChallenge.letter}
                  </span>
                  <span className="blitz-color">
                    <span
                      className={`blitz-swatch is-${blitzChallenge.color}`}
                      style={{ background: flagColorHex(blitzChallenge.color) }}
                      aria-hidden
                    />
                    {t(flagColorLabelKey(blitzChallenge.color))}
                  </span>
                  <span
                    className={`blitz-timer ${blitzSecondsLeft <= 5 ? 'is-urgent' : ''}`}
                    aria-label={t('ariaSeconds', { n: blitzSecondsLeft })}
                  >
                    {blitzSecondsLeft}s
                  </span>
                </div>
                <div className="blitz-slots" aria-label={t('ariaBlitzSlots')}>
                  {(
                    [
                      ['country', 'slotCountry', blitzAnswers.country],
                      ['capital', 'slotCapital', blitzAnswers.capital],
                      ['flag', 'slotFlag', blitzAnswers.flag],
                    ] as const
                  ).map(([key, labelKey, value]) => (
                    <div
                      key={key}
                      className={`blitz-slot ${value ? 'is-filled' : ''}`}
                    >
                      <span className="blitz-slot-label">{t(labelKey)}</span>
                      <span className={`blitz-slot-value ${value ? '' : 'is-empty'}`}>
                        {blitzSlotLabel(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : promptFlagUrl ? (
              <div className="prompt-flag-wrap">
                <img
                  key={promptFlagUrl}
                  className="prompt-flag"
                  src={promptFlagUrl}
                  alt={t('flagAlt')}
                  decoding="async"
                />
              </div>
            ) : promptValue ? (
              <h2 className="prompt-country">{promptValue}</h2>
            ) : (
              <h2 className="prompt-country">…</h2>
            )}
            {message ? <p className={`prompt-feedback is-${feedback}`}>{message}</p> : null}
            {mode === 'blitz' && phase === 'reveal' ? (
              <button
                type="button"
                className="cta blitz-next"
                onClick={() => startBlitzRound(pool)}
              >
                {t('nextRound')}
              </button>
            ) : null}
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
            <div>
              <span className="stat-value">{round}</span>
              <span className="stat-label">{t('round')}</span>
            </div>
          </div>
        </header>
      ) : null}

      <main
        className={`stage ${mapIdle ? 'stage-intro' : ''} ${showOrbit ? 'stage-orbit' : ''} ${showSetup ? 'stage-setup' : ''}`}
      >
        <div className={`globe-frame ${showOrbit ? 'globe-frame-orbit' : ''}`}>
          {showOrbit ? (
            <div className="mode-orbit" role="navigation" aria-label={t('ariaPickMode')}>
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
                    <span className="mode-orbit-label">
                      {t(MODE_UI_KEYS[opt.id].short)}
                    </span>
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
