import { useMemo, useState } from 'react'
import { WorldMap } from '../WorldMap'
import { useLocale } from '../i18n'
import { RoundResult } from './RoundResult'
import { nightCircleCenter, subsolarPoint } from './sun'
import { factsForSubsolar, scoreSubsolar, subsolarFromSliders } from './dayNightLogic'
import { loadCities } from '../cities'
import { isDaylight } from './sun'
import { useEffect } from 'react'
import type { LonLat } from './geo'

type Props = {
  warmup: boolean
  onScored: (points: number) => void
}

function randomTarget(): { labelKey: string; date: Date; city: string } {
  const samples = [
    { city: 'Berlin', date: new Date(Date.UTC(2024, 11, 21, 17, 0)) }, // 18:00 Berlin ~ UTC+1
    { city: 'Tokyo', date: new Date(Date.UTC(2024, 5, 21, 3, 0)) },
    { city: 'New York', date: new Date(Date.UTC(2024, 2, 20, 17, 0)) },
    { city: 'Sydney', date: new Date(Date.UTC(2024, 11, 21, 7, 0)) },
  ]
  const s = samples[Math.floor(Math.random() * samples.length)]!
  return { labelKey: 'labDayNightPrompt', date: s.date, city: s.city }
}

export function DayNight({ warmup, onScored }: Props) {
  const { t } = useLocale()
  const [target, setTarget] = useState(randomTarget)
  const [hour, setHour] = useState(12)
  const [doy, setDoy] = useState(172)
  const [result, setResult] = useState<{ points: number; facts: string[] } | null>(null)
  const [warmupCity, setWarmupCity] = useState<{ name: string; lonlat: LonLat } | null>(null)

  const truth = useMemo(() => subsolarPoint(target.date), [target])
  const guess = useMemo(() => subsolarFromSliders(hour, doy), [hour, doy])
  const nowSub = useMemo(() => subsolarPoint(new Date()), [])

  useEffect(() => {
    if (!warmup) return
    void loadCities().then((cities) => {
      const c = cities[Math.floor(Math.random() * Math.min(40, cities.length))]!
      setWarmupCity({ name: c.properties.name, lonlat: c.geometry.coordinates as LonLat })
    })
  }, [warmup, result])

  const submit = () => {
    const points = scoreSubsolar(guess, truth)
    const facts = factsForSubsolar(truth).map((f) =>
      f.kind === 'polar'
        ? t(f.day ? 'labFactMidnightSun' : 'labFactPolarNight', { city: f.city })
        : t(f.day ? 'labFactSunrise' : 'labFactSunset', { city: f.city }),
    )
    setResult({ points, facts })
    onScored(points)
  }

  const next = () => {
    setTarget(randomTarget())
    setHour(12)
    setDoy(172)
    setResult(null)
  }

  if (warmup) {
    const sub = nowSub
    return (
      <div className="lab-mode">
        <p className="lab-prompt">
          {warmupCity
            ? t('labDayNightWarmup', { city: warmupCity.name })
            : t('mapLoading')}
        </p>
        <WorldMap
          targetId={null}
          feedback="idle"
          wrongId={null}
          onSelect={() => {}}
          interactive={false}
          activeIds={null}
          focus="all"
          zoomCountry={null}
          regions={null}
          targetRegionId={null}
          wrongRegionId={null}
          cities={null}
          targetCityId={null}
          wrongCityId={null}
          selectMode="country"
          nightShade={{ center: nightCircleCenter(sub) }}
          autoRotate
        />
        {warmupCity ? (
          <div className="lab-mc">
            <button
              type="button"
              className="cta"
              onClick={() => {
                const day = isDaylight(warmupCity.lonlat, sub)
                onScored(day ? 100 : 0)
                setResult({ points: day ? 100 : 0, facts: [] })
              }}
            >
              {t('labDay')}
            </button>
            <button
              type="button"
              className="cta cta-secondary"
              onClick={() => {
                const day = isDaylight(warmupCity.lonlat, sub)
                onScored(day ? 0 : 100)
                setResult({ points: day ? 0 : 100, facts: [] })
              }}
            >
              {t('labNight')}
            </button>
          </div>
        ) : null}
        {result ? <RoundResult points={result.points} explanation="" onNext={() => setResult(null)} /> : null}
      </div>
    )
  }

  return (
    <div className="lab-mode">
      <p className="lab-prompt">{t('labDayNightPrompt', { city: target.city })}</p>
      <WorldMap
        targetId={null}
        feedback="idle"
        wrongId={null}
        onSelect={() => {}}
        interactive
        activeIds={null}
        focus="all"
        zoomCountry={null}
        regions={null}
        targetRegionId={null}
        wrongRegionId={null}
        cities={null}
        targetCityId={null}
        wrongCityId={null}
        selectMode="country"
        nightShade={{ center: nightCircleCenter(result ? truth : guess) }}
      />
      {!result ? (
        <div className="lab-controls">
          <label>
            {t('labSliderTime')}
            <input type="range" min={0} max={24} step={0.25} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
          </label>
          <label>
            {t('labSliderSeason')}
            <input type="range" min={1} max={365} step={1} value={doy} onChange={(e) => setDoy(Number(e.target.value))} />
          </label>
          <button type="button" className="cta" onClick={submit}>
            {t('labSubmit')}
          </button>
        </div>
      ) : (
        <RoundResult
          points={result.points}
          explanation={result.facts.join(' ')}
          onNext={next}
        />
      )}
    </div>
  )
}
