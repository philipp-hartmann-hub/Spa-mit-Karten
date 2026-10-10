import { useEffect, useMemo, useState } from 'react'
import type { CountryFeature } from '../WorldMap'
import { WorldMap, countryLabel, normalizeId } from '../WorldMap'
import { loadCities, type CityFeature } from '../cities'
import { useLocale } from '../i18n'
import { antipode, countryAt, distanceKm, greatCirclePoints, type LonLat } from './geo'
import { oceanAt } from './oceans'
import { RoundResult } from './RoundResult'
import { scoreAntipodeGuess, scoreAntipodeMc } from './antipodeLogic'

type Props = {
  countries: CountryFeature[]
  bonusMc: boolean
  onScored: (points: number) => void
}

function pickStart(cities: CityFeature[]): { name: string; lonlat: LonLat } {
  const ranked = [...cities].sort((a, b) => a.properties.rank - b.properties.rank).slice(0, 80)
  const c = ranked[Math.floor(Math.random() * ranked.length)] ?? cities[0]!
  return {
    name: c.properties.name,
    lonlat: c.geometry.coordinates as LonLat,
  }
}

export function Antipode({ countries, bonusMc, onScored }: Props) {
  const { locale, t } = useLocale()
  const [cities, setCities] = useState<CityFeature[]>([])
  const [start, setStart] = useState<{ name: string; lonlat: LonLat } | null>(null)
  const [guess, setGuess] = useState<LonLat | null>(null)
  const [result, setResult] = useState<{
    points: number
    truth: LonLat
    label: string
    showFact: boolean
  } | null>(null)
  const [mcOptions, setMcOptions] = useState<string[]>([])
  const [playedOnce, setPlayedOnce] = useState(false)

  useEffect(() => {
    void loadCities().then((list) => {
      setCities(list)
      setStart(pickStart(list))
    })
  }, [])

  const truth = useMemo(() => (start ? antipode(start.lonlat) : null), [start])

  useEffect(() => {
    if (!bonusMc || !truth) return
    const hit = countryAt(truth, countries)
    const correct = hit
      ? countryLabel(hit as CountryFeature, locale)
      : t(`ocean${capitalize(oceanAt(truth[0], truth[1]) ?? 'pacific')}` as 'oceanPacific')
    const opts = new Set<string>([correct])
    while (opts.size < 4) {
      const c = countries[Math.floor(Math.random() * countries.length)]!
      opts.add(countryLabel(c, locale))
    }
    setMcOptions([...opts].sort(() => Math.random() - 0.5))
  }, [bonusMc, truth, countries, locale, t])

  if (!start || !truth) return <p className="lab-prompt">{t('mapLoading')}</p>

  const finish = (points: number, g: LonLat | null) => {
    const hit = countryAt(truth, countries)
    const ocean = oceanAt(truth[0], truth[1])
    const label = hit
      ? countryLabel(hit as CountryFeature, locale)
      : ocean
        ? t(`ocean${capitalize(ocean)}` as 'oceanPacific')
        : t('labOcean')
    setGuess(g)
    setResult({ points, truth, label, showFact: !playedOnce })
    setPlayedOnce(true)
    onScored(points)
  }

  const next = () => {
    if (cities.length) setStart(pickStart(cities))
    setGuess(null)
    setResult(null)
  }

  return (
    <div className="lab-mode">
      <p className="lab-prompt">{t('labAntipodePrompt', { place: start.name })}</p>
      <WorldMap
        targetId={null}
        feedback="idle"
        wrongId={null}
        onSelect={() => {}}
        interactive={!result && !bonusMc}
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
        onPointSelect={(ll) => {
          if (result || bonusMc) return
          finish(scoreAntipodeGuess(ll, truth), ll)
        }}
        markers={[
          { id: 'start', lonlat: start.lonlat, className: 'lab-globe-marker is-start' },
          ...(guess ? [{ id: 'guess', lonlat: guess, className: 'lab-globe-marker is-guess' }] : []),
          ...(result
            ? [{ id: 'truth', lonlat: truth, className: 'lab-globe-marker is-truth' }]
            : []),
        ]}
        pathCoords={result ? greatCirclePoints(start.lonlat, truth, 60) : undefined}
        rotateTo={result ? truth : null}
      />
      {bonusMc && !result ? (
        <div className="lab-mc">
          {mcOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              className="cta cta-secondary"
              onClick={() => {
                const hit = countryAt(truth, countries)
                const correct = hit
                  ? countryLabel(hit as CountryFeature, locale)
                  : t(`ocean${capitalize(oceanAt(truth[0], truth[1]) ?? 'pacific')}` as 'oceanPacific')
                finish(scoreAntipodeMc(opt === correct), null)
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : null}
      {result ? (
        <RoundResult
          points={result.points}
          explanation={[
            t('labAntipodeResult', {
              place: result.label,
              km: guess
                ? Math.round(distanceKm(guess, truth)).toLocaleString(locale)
                : '—',
            }),
            result.showFact ? t('labAntipodeFact') : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onNext={next}
        />
      ) : null}
      <span className="u-hide">{normalizeId(countries[0]?.id)}</span>
    </div>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
