import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'
import {
  WorldMap,
  countryLabel,
  getPlayableCountries,
  normalizeId,
  type CountryFeature,
} from '../WorldMap'
import {
  CONTINENT_OPTIONS,
  CONTINENT_UI_KEYS,
  type ContinentFilter,
} from '../continents'
import { capitalOf } from '../capitals'
import { countryFlagUrl } from '../flags'
import { regionCapitalOf } from '../regionCapitals'
import { cityLabel, citiesForCountry, countriesWithCities, loadCities, type CityFeature } from '../cities'
import {
  loadRegions,
  regionLabel,
  regionsForCountry,
  countriesWithRegions,
  type RegionFeature,
} from '../admin1'
import {
  MODE_OPTIONS,
  MODE_UI_KEYS,
  REGION_QUIZ_OPTIONS,
  REGION_QUIZ_UI_KEYS,
  type GameMode,
  type RegionQuiz,
} from '../gameModes'
import {
  BLITZ_SECONDS,
  emptyBlitzAnswers,
  matchBlitzCategory,
  type BlitzAnswers,
  type BlitzChallenge,
} from '../blitz'
import { flagColorHex, flagColorLabelKey, type FlagColor } from '../flagColors'
import { LanguagePicker, useLocale } from '../i18n'
import { generateBlitzQuestions, generateRaceQuestions, scoreBlitzRound } from './questions'
import {
  createRoomCode,
  joinUrl,
  MP_DEFAULT_ROUNDS,
  MP_MAX_PLAYERS,
  MP_MAX_ROUNDS,
  MP_MIN_ROUNDS,
  type ClientToHost,
  type HostToClient,
  type MpGameConfig,
  type MpPlayer,
  type MpRaceProgress,
  type MpRaceQuestion,
  type MpRankingEntry,
  type MpBlitzQuestion,
} from './types'
import { useMultiplayerRoom } from './useMultiplayerRoom'

type Phase = 'lobby' | 'playing' | 'results'
type Feedback = 'idle' | 'correct' | 'wrong'

type WorldTopology = Topology<{ countries: GeometryCollection }>

type Props = {
  role: 'host' | 'guest'
  initialCode?: string
  onExit: () => void
}

export function MultiplayerApp({ role, initialCode, onExit }: Props) {
  const { locale, t } = useLocale()
  const [roomCode] = useState(() => (initialCode || createRoomCode()).toUpperCase())
  const [name, setName] = useState(() => (role === 'host' ? 'Host' : 'Player'))
  const [phase, setPhase] = useState<Phase>('lobby')
  const [mode, setMode] = useState<GameMode>('country')
  const [continent, setContinent] = useState<ContinentFilter>('all')
  const [regionCountryId, setRegionCountryId] = useState('')
  const [regionQuiz, setRegionQuiz] = useState<RegionQuiz>('name')
  const [rounds, setRounds] = useState(MP_DEFAULT_ROUNDS)

  const [allCountries, setAllCountries] = useState<CountryFeature[]>([])
  const [regionReady, setRegionReady] = useState(false)
  const [citiesReady, setCitiesReady] = useState(false)

  const room = useMultiplayerRoom({
    role,
    roomCode,
    displayName: name,
    enabled: true,
  })

  const [raceQuestions, setRaceQuestions] = useState<MpRaceQuestion[]>([])
  const [raceIndex, setRaceIndex] = useState(0)
  const [raceStartedAt, setRaceStartedAt] = useState(0)
  const [raceProgress, setRaceProgress] = useState<MpRaceProgress[]>([])
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const [resultsKind, setResultsKind] = useState<'race' | 'blitz'>('race')
  const blitzEndingRef = useRef(false)

  const [blitzQuestions, setBlitzQuestions] = useState<MpBlitzQuestion[]>([])
  const [blitzRound, setBlitzRound] = useState(0)
  const [blitzEndsAt, setBlitzEndsAt] = useState(0)
  const [blitzSecondsLeft, setBlitzSecondsLeft] = useState(BLITZ_SECONDS)
  const [blitzAnswers, setBlitzAnswers] = useState<BlitzAnswers>(emptyBlitzAnswers())
  const [blitzScores, setBlitzScores] = useState<Record<string, number>>({})
  const [lastRoundPoints, setLastRoundPoints] = useState<Record<string, number>>({})
  const blitzAnswersRef = useRef(blitzAnswers)
  const pendingBlitzRef = useRef<
    Record<string, { country: string | null; capital: string | null; flag: string | null }>
  >({})

  const [ranking, setRanking] = useState<MpRankingEntry[]>([])
  const [feedback, setFeedback] = useState<Feedback>('idle')
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const [target, setTarget] = useState<CountryFeature | null>(null)
  const [targetRegion, setTargetRegion] = useState<RegionFeature | null>(null)
  const [targetCity, setTargetCity] = useState<CityFeature | null>(null)
  const [zoomCountry, setZoomCountry] = useState<CountryFeature | null>(null)
  const [activeRegions, setActiveRegions] = useState<RegionFeature[]>([])
  const [activeCities, setActiveCities] = useState<CityFeature[]>([])

  useEffect(() => {
    blitzAnswersRef.current = blitzAnswers
  }, [blitzAnswers])

  useEffect(() => {
    fetch('/countries-110m.json')
      .then((r) => r.json())
      .then((topo: WorldTopology) => {
        const fc = feature(topo, topo.objects.countries) as FeatureCollection<
          Geometry,
          { name: string }
        >
        setAllCountries(getPlayableCountries(fc.features as CountryFeature[]))
      })
    loadRegions().then(() => setRegionReady(true)).catch(console.error)
    loadCities().then(() => setCitiesReady(true)).catch(console.error)
  }, [])

  const link = useMemo(() => joinUrl(roomCode), [roomCode])

  useEffect(() => {
    window.location.hash = `#/m/${roomCode}`
  }, [roomCode])

  const applyRaceQuestion = useCallback(
    (q: MpRaceQuestion) => {
      setFeedback('idle')
      setWrongId(null)
      setMessage('')
      if (q.kind === 'country' || q.kind === 'capital' || q.kind === 'flag') {
        const f = allCountries.find((c) => normalizeId(c.id) === q.targetId) ?? null
        setTarget(f)
        setTargetRegion(null)
        setTargetCity(null)
        setZoomCountry(null)
        setActiveRegions([])
        setActiveCities([])
        return
      }
      if (q.kind === 'region') {
        const f = allCountries.find((c) => normalizeId(c.id) === q.countryId) ?? null
        const regions = regionsForCountry(q.countryId)
        const region = regions.find((r) => r.properties.id === q.regionId) ?? null
        setTarget(f)
        setZoomCountry(f)
        setActiveRegions(regions)
        setActiveCities([])
        setTargetRegion(region)
        setTargetCity(null)
        return
      }
      if (q.kind === 'city') {
        const f = allCountries.find((c) => normalizeId(c.id) === q.countryId) ?? null
        const cities = citiesForCountry(q.countryId)
        const city = cities.find((c) => c.properties.id === q.cityId) ?? null
        setTarget(f)
        setZoomCountry(f)
        setActiveRegions(regionsForCountry(q.countryId))
        setActiveCities(cities)
        setTargetRegion(null)
        setTargetCity(city)
      }
    },
    [allCountries],
  )

  // Listen to host broadcasts (guests + host self)
  useEffect(() => {
    const onHost = (e: Event) => {
      const msg = (e as CustomEvent<HostToClient>).detail
      if (!msg) return

      if (msg.type === 'race-start') {
        setRaceQuestions(msg.questions)
        setRaceStartedAt(msg.startedAt)
        setRaceIndex(0)
        setFinishedAt(null)
        setRaceProgress(
          room.players.map((p) => ({ playerId: p.id, index: 0, finishedAt: null })),
        )
        setPhase('playing')
        setMode(msg.config.mode)
        if (msg.questions[0]) applyRaceQuestion(msg.questions[0])
      }

      if (msg.type === 'race-update') {
        setRaceProgress(msg.progress)
      }

      if (msg.type === 'blitz-start') {
        blitzEndingRef.current = false
        setBlitzQuestions(msg.questions)
        setBlitzRound(msg.roundIndex)
        setBlitzEndsAt(msg.roundEndsAt)
        setBlitzAnswers(emptyBlitzAnswers())
        setBlitzScores({})
        setLastRoundPoints({})
        pendingBlitzRef.current = {}
        setPhase('playing')
        setMode('blitz')
        setFeedback('idle')
        setMessage('')
      }

      if (msg.type === 'blitz-next') {
        blitzEndingRef.current = false
        setBlitzRound(msg.roundIndex)
        setBlitzEndsAt(msg.roundEndsAt)
        setBlitzScores(msg.scores)
        setLastRoundPoints(msg.lastRoundPoints)
        setBlitzAnswers(emptyBlitzAnswers())
        pendingBlitzRef.current = {}
        setFeedback('idle')
        setMessage('')
      }

      if (msg.type === 'results') {
        setRanking(msg.ranking)
        setResultsKind(msg.kind)
        if (msg.scores) setBlitzScores(msg.scores)
        setPhase('results')
      }

      if (msg.type === 'back-lobby') {
        setPhase('lobby')
      }
    }

    window.addEventListener('smk-mp-host', onHost)
    return () => window.removeEventListener('smk-mp-host', onHost)
  }, [applyRaceQuestion, room.players])

  // Host handles client messages
  useEffect(() => {
    if (role !== 'host') return

    const onClient = (e: Event) => {
      const msg = (e as CustomEvent<ClientToHost>).detail
      if (!msg) return

      if (msg.type === 'race-progress') {
        setRaceProgress((prev) => {
          const next = prev.map((p) =>
            p.playerId === msg.playerId
              ? { playerId: msg.playerId, index: msg.index, finishedAt: msg.finishedAt }
              : p,
          )
          const exists = next.some((p) => p.playerId === msg.playerId)
          const merged = exists
            ? next
            : [...next, { playerId: msg.playerId, index: msg.index, finishedAt: msg.finishedAt }]
          room.hostBroadcast({ type: 'race-update', progress: merged })

          const players = room.players
          const allDone =
            players.length > 0 &&
            players.every((pl) => merged.find((m) => m.playerId === pl.id)?.finishedAt != null)
          if (allDone) {
            const ranking: MpRankingEntry[] = players
              .map((pl) => {
                const pr = merged.find((m) => m.playerId === pl.id)
                const ms = pr?.finishedAt && raceStartedAt ? pr.finishedAt - raceStartedAt : Infinity
                return { playerId: pl.id, name: pl.name, value: ms }
              })
              .sort((a, b) => a.value - b.value)
            room.hostBroadcast({ type: 'results', kind: 'race', ranking })
          }
          return merged
        })
      }

      if (msg.type === 'blitz-submit') {
        pendingBlitzRef.current[msg.playerId] = msg.answers
      }
    }

    window.addEventListener('smk-mp-client', onClient)
    return () => window.removeEventListener('smk-mp-client', onClient)
  }, [role, room, raceStartedAt])

  // Blitz countdown
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'blitz' || !blitzEndsAt) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((blitzEndsAt - Date.now()) / 1000))
      setBlitzSecondsLeft(left)
      if (left <= 0 && role === 'host') {
        endBlitzRound()
      }
    }
    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, blitzEndsAt, blitzRound, role])

  const endBlitzRound = () => {
    if (blitzEndingRef.current) return
    blitzEndingRef.current = true
    // Include host local answers
    pendingBlitzRef.current[room.playerId] = {
      country: blitzAnswersRef.current.country,
      capital: blitzAnswersRef.current.capital,
      flag: blitzAnswersRef.current.flag,
    }
    const roundPts = scoreBlitzRound(pendingBlitzRef.current)
    const scores = { ...blitzScores }
    for (const [pid, pts] of Object.entries(roundPts)) {
      scores[pid] = (scores[pid] ?? 0) + pts
    }
    pendingBlitzRef.current = {}
    const nextRound = blitzRound + 1
    if (nextRound >= blitzQuestions.length) {
      const ranking: MpRankingEntry[] = room.players
        .map((pl) => ({
          playerId: pl.id,
          name: pl.name,
          value: scores[pl.id] ?? 0,
        }))
        .sort((a, b) => b.value - a.value)
      room.hostBroadcast({ type: 'results', kind: 'blitz', ranking, scores })
      return
    }
    const roundEndsAt = Date.now() + BLITZ_SECONDS * 1000
    blitzEndingRef.current = false
    room.hostBroadcast({
      type: 'blitz-next',
      roundIndex: nextRound,
      roundEndsAt,
      scores,
      lastRoundPoints: roundPts,
    })
  }

  const startGame = () => {
    if (role !== 'host') return
    const config: MpGameConfig = {
      mode,
      continent,
      regionCountryId: regionCountryId || undefined,
      regionQuiz,
      rounds,
      locale,
    }

    if (mode === 'blitz') {
      const questions = generateBlitzQuestions(allCountries, config)
      if (questions.length === 0) return
      const roundEndsAt = Date.now() + BLITZ_SECONDS * 1000
      room.hostBroadcast({
        type: 'blitz-start',
        questions,
        config,
        roundIndex: 0,
        roundEndsAt,
      })
      return
    }

    const questions = generateRaceQuestions(allCountries, config)
    if (questions.length === 0) return
    const startedAt = Date.now()
    room.hostBroadcast({
      type: 'race-start',
      questions,
      startedAt,
      config,
    })
  }

  const reportRaceProgress = (index: number, doneAt: number | null) => {
    room.guestSend({
      type: 'race-progress',
      playerId: room.playerId,
      index,
      finishedAt: doneAt,
    })
  }

  const onSelect = (id: string) => {
    if (phase !== 'playing') return

    if (mode === 'blitz') {
      const q = blitzQuestions[blitzRound]
      if (!q) return
      const challenge: BlitzChallenge = {
        letter: q.letter,
        color: q.color as FlagColor,
      }
      const feature = allCountries.find((c) => normalizeId(c.id) === id)
      if (!feature) return
      const already =
        blitzAnswers.country === id ||
        blitzAnswers.capital === id ||
        blitzAnswers.flag === id
      if (already) return
      const cat = matchBlitzCategory(feature, challenge, blitzAnswers, locale)
      if (!cat) {
        setFeedback('wrong')
        setWrongId(id)
        setMessage(t('blitzNoMatch', { name: countryLabel(feature, locale) }))
        window.setTimeout(() => {
          setFeedback('idle')
          setWrongId(null)
          setMessage('')
        }, 800)
        return
      }
      const next = { ...blitzAnswers, [cat]: id }
      setBlitzAnswers(next)
      blitzAnswersRef.current = next
      setFeedback('correct')
      setMessage(
        t('blitzHit', {
          category: t(
            cat === 'country' ? 'slotCountry' : cat === 'capital' ? 'slotCapital' : 'slotFlag',
          ),
          name: countryLabel(feature, locale),
        }),
      )
      room.guestSend({
        type: 'blitz-submit',
        playerId: room.playerId,
        roundIndex: blitzRound,
        answers: next,
      })
      return
    }

    const q = raceQuestions[raceIndex]
    if (!q || finishedAt) return

    let correct = false
    if (q.kind === 'country' || q.kind === 'capital' || q.kind === 'flag') {
      correct = id === q.targetId
    } else if (q.kind === 'region') {
      correct = id === q.regionId
    } else if (q.kind === 'city') {
      correct = id === q.cityId
    }

    if (!correct) {
      // Nur falschen Klick markieren — Lösung nicht orange freigeben
      setFeedback('idle')
      setWrongId(id)
      setMessage(t('mpKeepTrying'))
      return
    }

    setFeedback('correct')
    setWrongId(null)
    const nextIndex = raceIndex + 1
    if (nextIndex >= raceQuestions.length) {
      const done = Date.now()
      setFinishedAt(done)
      setMessage(t('mpFinished'))
      reportRaceProgress(nextIndex, done)
      return
    }
    setRaceIndex(nextIndex)
    reportRaceProgress(nextIndex, null)
    applyRaceQuestion(raceQuestions[nextIndex]!)
    setMessage(t('hit'))
    window.setTimeout(() => {
      setFeedback('idle')
      setMessage('')
    }, 500)
  }

  const backToLobby = () => {
    if (role === 'host') room.hostBroadcast({ type: 'back-lobby' })
    setPhase('lobby')
  }

  const currentBlitz = blitzQuestions[blitzRound]
  const currentRace = raceQuestions[raceIndex]
  const needsCountryPick = mode === 'regions' || mode === 'cities'
  const loadingData =
    (mode === 'regions' && !regionReady) || (mode === 'cities' && !citiesReady)

  const regionCountryOptions = useMemo(() => {
    const cityIds = new Set(citiesReady ? countriesWithCities(3) : [])
    const regionIds = new Set(regionReady ? countriesWithRegions() : [])
    return allCountries
      .filter((c) => {
        const id = normalizeId(c.id)
        if (mode === 'cities') return cityIds.has(id)
        if (mode === 'regions') return regionIds.has(id)
        return true
      })
      .map((c) => ({ id: normalizeId(c.id), label: countryLabel(c, locale) }))
      .sort((a, b) => a.label.localeCompare(b.label, locale))
  }, [allCountries, locale, mode, citiesReady, regionReady])

  useEffect(() => {
    if (!needsCountryPick) return
    if (regionCountryOptions.length === 0) {
      if (regionCountryId) setRegionCountryId('')
      return
    }
    if (!regionCountryOptions.some((o) => o.id === regionCountryId)) {
      setRegionCountryId(regionCountryOptions[0]!.id)
    }
  }, [needsCountryPick, regionCountryOptions, regionCountryId])

  const targetId = target ? normalizeId(target.id) : null
  const promptFlagUrl =
    currentRace?.kind === 'flag'
      ? countryFlagUrl(currentRace.targetId)
      : currentRace?.kind === 'region' && currentRace.quiz === 'flag'
        ? null
        : mode === 'flag' && targetId
          ? countryFlagUrl(targetId)
          : null

  let promptValue: string | null = null
  let promptLabel = t('promptFind')
  if (phase === 'playing' && mode !== 'blitz' && currentRace) {
    if (currentRace.kind === 'country') {
      promptLabel = t('promptFind')
      promptValue = countryLabel(
        allCountries.find((c) => normalizeId(c.id) === currentRace.targetId)!,
        locale,
      )
    } else if (currentRace.kind === 'capital') {
      promptLabel = t('promptCapital')
      promptValue = capitalOf(currentRace.targetId, locale)
    } else if (currentRace.kind === 'flag') {
      promptLabel = t('promptFlag')
      promptValue = null
    } else if (currentRace.kind === 'region') {
      const countryName =
        countryLabel(
          allCountries.find((c) => normalizeId(c.id) === currentRace.countryId)!,
          locale,
        ) || '…'
      if (currentRace.quiz === 'capital') {
        promptLabel = t('promptRegionCapital', { country: countryName })
        promptValue = regionCapitalOf(currentRace.regionId)
      } else if (currentRace.quiz === 'flag') {
        promptLabel = t('promptRegionFlag', { country: countryName })
        promptValue = null
      } else {
        promptLabel = t('promptRegion', { country: countryName })
        promptValue = targetRegion ? regionLabel(targetRegion) : '…'
      }
    } else if (currentRace.kind === 'city') {
      const countryName =
        countryLabel(
          allCountries.find((c) => normalizeId(c.id) === currentRace.countryId)!,
          locale,
        ) || '…'
      promptLabel = t('promptCity', { country: countryName })
      promptValue = targetCity ? cityLabel(targetCity) : '…'
    }
  }

  const selectMode =
    mode === 'cities' ? 'city' : mode === 'regions' ? 'region' : 'country'

  if (phase === 'lobby') {
    return (
      <div className="mp-shell">
        <div className="atmosphere" aria-hidden />
        <header className="mp-lobby">
          <button type="button" className="setup-back" onClick={onExit}>
            {t('backHome')}
          </button>
          <LanguagePicker className="lang-picker-setup" />
          <h1 className="setup-title">{t('mpLobbyTitle')}</h1>
          <p className="setup-hint">
            {role === 'host' ? t('mpHostHint') : t('mpGuestHint')}
          </p>

          <label className="filter">
            <span className="filter-label">{t('mpYourName')}</span>
            <input
              className="filter-select"
              value={name}
              maxLength={24}
              onChange={(e) => {
                setName(e.target.value)
                room.updateName(e.target.value)
              }}
            />
          </label>

          <div className="mp-room-code">
            <span className="filter-label">{t('mpRoomCode')}</span>
            <strong>{roomCode}</strong>
          </div>

          {role === 'host' ? (
            <div className="mp-share">
              <QRCodeSVG value={link} size={160} bgColor="transparent" fgColor="#e8d9b8" />
              <p className="mp-link">{link}</p>
              <button
                type="button"
                className="mode-option"
                onClick={() => navigator.clipboard?.writeText(link)}
              >
                {t('mpCopyLink')}
              </button>
            </div>
          ) : null}

          {!room.connected && !room.error ? (
            <p className="setup-hint">{t('mpConnecting')}</p>
          ) : null}
          {room.error ? (
            <p className="prompt-feedback is-wrong">{t('mpError', { error: room.error })}</p>
          ) : null}

          <div className="mp-players">
            <h2>{t('mpPlayers', { n: room.players.length, max: MP_MAX_PLAYERS })}</h2>
            <ul>
              {room.players.map((p: MpPlayer) => (
                <li key={p.id}>
                  {p.name}
                  {p.isHost ? ` (${t('mpHostBadge')})` : ''}
                  {p.id === room.playerId ? ` ←` : ''}
                </li>
              ))}
            </ul>
          </div>

          {role === 'host' ? (
            <div className="mp-host-config">
              <fieldset className="mode-picker">
                <legend className="filter-label">{t('mode')}</legend>
                <div className="mode-options mode-options-3">
                  {MODE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`mode-option ${mode === opt.id ? 'is-active' : ''}`}
                      onClick={() => setMode(opt.id)}
                    >
                      {t(MODE_UI_KEYS[opt.id].short)}
                    </button>
                  ))}
                </div>
              </fieldset>

              {mode === 'regions' ? (
                <fieldset className="mode-picker">
                  <legend className="filter-label">{t('task')}</legend>
                  <div className="mode-options mode-options-3">
                    {REGION_QUIZ_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`mode-option ${regionQuiz === opt.id ? 'is-active' : ''}`}
                        onClick={() => setRegionQuiz(opt.id)}
                      >
                        {t(REGION_QUIZ_UI_KEYS[opt.id])}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              <label className="filter">
                <span className="filter-label">{t('continent')}</span>
                <select
                  className="filter-select"
                  value={continent}
                  onChange={(e) => setContinent(e.target.value as ContinentFilter)}
                >
                  {CONTINENT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {t(CONTINENT_UI_KEYS[opt.id])}
                    </option>
                  ))}
                </select>
              </label>

              {needsCountryPick ? (
                <label className="filter">
                  <span className="filter-label">{t('country')}</span>
                  <select
                    className="filter-select"
                    value={regionCountryId}
                    onChange={(e) => setRegionCountryId(e.target.value)}
                    disabled={loadingData}
                  >
                    <option value="">{t('noCountries')}</option>
                    {regionCountryOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {mode !== 'cities' ? (
                <label className="filter">
                  <span className="filter-label">{t('mpRounds')}</span>
                  <input
                    className="filter-select"
                    type="number"
                    min={MP_MIN_ROUNDS}
                    max={MP_MAX_ROUNDS}
                    value={rounds}
                    onChange={(e) =>
                      setRounds(
                        Math.min(
                          MP_MAX_ROUNDS,
                          Math.max(MP_MIN_ROUNDS, Number(e.target.value) || MP_DEFAULT_ROUNDS),
                        ),
                      )
                    }
                  />
                </label>
              ) : null}

              <p className="setup-hint">
                {mode === 'blitz'
                  ? t('mpBlitzRules')
                  : mode === 'cities'
                    ? t('mpCitiesRules')
                    : t('mpRaceRules')}
              </p>

              <button
                type="button"
                className="cta"
                onClick={startGame}
                disabled={
                  !room.connected ||
                  allCountries.length === 0 ||
                  loadingData ||
                  (needsCountryPick && !regionCountryId)
                }
              >
                {t('mpStartGame')}
              </button>
            </div>
          ) : (
            <p className="setup-hint">{t('mpWaitHost')}</p>
          )}
        </header>
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <div className="mp-shell">
        <div className="atmosphere" aria-hidden />
        <header className="mp-lobby">
          <h1 className="setup-title">{t('mpResults')}</h1>
          <ol className="mp-ranking">
            {ranking.map((entry, i) => (
              <li key={entry.playerId}>
                <span>
                  {i + 1}. {entry.name}
                </span>
                <strong>
                  {resultsKind === 'blitz'
                    ? t('mpPointsValue', { n: entry.value })
                    : entry.value === Infinity
                      ? '—'
                      : t('mpTimeValue', { s: (entry.value / 1000).toFixed(1) })}
                </strong>
              </li>
            ))}
          </ol>
          {role === 'host' ? (
            <button type="button" className="cta" onClick={backToLobby}>
              {t('mpBackLobby')}
            </button>
          ) : (
            <p className="setup-hint">{t('mpWaitHost')}</p>
          )}
        </header>
      </div>
    )
  }

  // Playing
  return (
    <div className={`app app-playing`}>
      <div className="atmosphere" aria-hidden />
      <header className="hud">
        <div className="hud-left">
          <div className="hud-brand">{t('brand')}</div>
          <div className="mp-live-meta">
            {mode === 'blitz'
              ? t('mpBlitzRound', { n: blitzRound + 1, total: blitzQuestions.length })
              : t('mpRaceRound', { n: Math.min(raceIndex + 1, raceQuestions.length), total: raceQuestions.length })}
          </div>
        </div>
        <div className="hud-prompt">
          {mode === 'blitz' && currentBlitz ? (
            <>
              <span className="prompt-label">{t('promptBlitz')}</span>
              <div className="blitz-prompt">
                <span className="blitz-letter">{currentBlitz.letter}</span>
                <span className="blitz-color">
                  <span
                    className={`blitz-swatch is-${currentBlitz.color}`}
                    style={{ background: flagColorHex(currentBlitz.color as FlagColor) }}
                  />
                  {t(flagColorLabelKey(currentBlitz.color as FlagColor))}
                </span>
                <span className={`blitz-timer ${blitzSecondsLeft <= 5 ? 'is-urgent' : ''}`}>
                  {blitzSecondsLeft}s
                </span>
              </div>
              <div className="blitz-slots">
                {(
                  [
                    ['country', t('slotCountry'), blitzAnswers.country],
                    ['capital', t('slotCapital'), blitzAnswers.capital],
                    ['flag', t('slotFlag'), blitzAnswers.flag],
                  ] as const
                ).map(([key, label, value]) => (
                  <div key={key} className={`blitz-slot ${value ? 'is-filled' : ''}`}>
                    <span className="blitz-slot-label">{label}</span>
                    <span className={`blitz-slot-value ${value ? '' : 'is-empty'}`}>
                      {value
                        ? countryLabel(
                            allCountries.find((c) => normalizeId(c.id) === value)!,
                            locale,
                          )
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
              {Object.keys(lastRoundPoints).length > 0 ? (
                <p className="prompt-feedback is-correct">
                  {t('mpLastRoundPts', {
                    n: lastRoundPoints[room.playerId] ?? 0,
                  })}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <span className="prompt-label">{promptLabel}</span>
              {promptFlagUrl ? (
                <div className="prompt-flag-wrap">
                  <img className="prompt-flag" src={promptFlagUrl} alt={t('flagAlt')} />
                </div>
              ) : promptValue ? (
                <h2 className="prompt-country">{promptValue}</h2>
              ) : (
                <h2 className="prompt-country">…</h2>
              )}
            </>
          )}
          {message ? <p className={`prompt-feedback is-${feedback}`}>{message}</p> : null}
          {finishedAt ? <p className="prompt-feedback is-correct">{t('mpWaitingOthers')}</p> : null}
        </div>
        <div className="hud-stats">
          {mode === 'blitz' ? (
            <div>
              <span className="stat-value">{blitzScores[room.playerId] ?? 0}</span>
              <span className="stat-label">{t('points')}</span>
            </div>
          ) : (
            <>
              <div>
                <span className="stat-value">
                  {raceStartedAt ? ((Date.now() - raceStartedAt) / 1000).toFixed(0) : 0}s
                </span>
                <span className="stat-label">{t('mpTime')}</span>
              </div>
              <div>
                <span className="stat-value">
                  {raceProgress.filter((p) => p.finishedAt != null).length}/{room.players.length}
                </span>
                <span className="stat-label">{t('mpFinished')}</span>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="stage">
        <div className="globe-frame">
          <WorldMap
            targetId={mode === 'blitz' ? null : targetId}
            feedback={feedback}
            wrongId={mode === 'regions' || mode === 'cities' ? null : wrongId}
            onSelect={onSelect}
            interactive={!finishedAt}
            autoRotate={false}
            activeIds={null}
            focus={continent}
            zoomCountry={
              mode === 'regions' || mode === 'cities' ? zoomCountry : null
            }
            regions={
              mode === 'regions' || mode === 'cities' ? activeRegions : null
            }
            targetRegionId={mode === 'regions' ? targetRegion?.properties.id ?? null : null}
            wrongRegionId={mode === 'regions' ? wrongId : null}
            cities={mode === 'cities' ? activeCities : null}
            targetCityId={mode === 'cities' ? targetCity?.properties.id ?? null : null}
            wrongCityId={mode === 'cities' ? wrongId : null}
            selectMode={selectMode}
          />
        </div>
      </main>
    </div>
  )
}
