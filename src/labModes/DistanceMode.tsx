import { useMemo, useState } from 'react'
import { geoCentroid } from 'd3-geo'
import type { CountryFeature } from '../WorldMap'
import { countryLabel, normalizeId } from '../WorldMap'
import { useLocale } from '../i18n'
import { distanceKm, greatCirclePoints, linearScore, type LonLat } from './geo'
import { FlatMap } from './FlatMap'
import { RoundResult } from './RoundResult'

type Props = {
  countries: CountryFeature[]
  onScored: (points: number) => void
}

function pickTwo(countries: CountryFeature[]): [CountryFeature, CountryFeature] {
  const a = countries[Math.floor(Math.random() * countries.length)]!
  let b = a
  let guard = 0
  while (normalizeId(b.id) === normalizeId(a.id) && guard++ < 20) {
    b = countries[Math.floor(Math.random() * countries.length)]!
  }
  return [a, b]
}

export function DistanceMode({ countries, onScored }: Props) {
  const { locale, t } = useLocale()
  const [pair, setPair] = useState(() => pickTwo(countries))
  const [guess, setGuess] = useState(2000)
  const [result, setResult] = useState<{ points: number; truth: number } | null>(null)

  const [a, b] = pair
  const ca = useMemo(() => geoCentroid(a) as LonLat, [a])
  const cb = useMemo(() => geoCentroid(b) as LonLat, [b])
  const truth = distanceKm(ca, cb)
  const gc = useMemo(() => greatCirclePoints(ca, cb, 80), [ca, cb])

  const submit = () => {
    const points = linearScore(Math.abs(guess - truth), 150, 4000)
    setResult({ points, truth })
    onScored(points)
  }

  const next = () => {
    setPair(pickTwo(countries))
    setGuess(2000)
    setResult(null)
  }

  return (
    <div className="lab-mode">
      <p className="lab-prompt">
        {t('labDistancePrompt', {
          a: countryLabel(a, locale),
          b: countryLabel(b, locale),
        })}
      </p>
      <FlatMap
        countries={countries}
        lockedProjection="equalEarth"
        fitIds={[normalizeId(a.id), normalizeId(b.id)]}
        showProjectionPicker={false}
      >
        {({ projection }) => (
          <g>
            {gc.map((p, i) => {
              if (i === 0) return null
              const a = projection(gc[i - 1]!)
              const b = projection(p)
              if (!a || !b) return null
              return (
                <line
                  key={i}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  className={result ? 'lab-gc-line' : 'lab-gc-line is-dim'}
                />
              )
            })}
          </g>
        )}
      </FlatMap>
      {!result ? (
        <div className="lab-controls">
          <label>
            {t('labDistanceGuess')}
            <input
              type="range"
              min={2}
              max={4.3}
              step={0.01}
              value={Math.log10(guess)}
              onChange={(e) => setGuess(10 ** Number(e.target.value))}
            />
            <span>{Math.round(guess).toLocaleString(locale)} km</span>
          </label>
          <button type="button" className="cta" onClick={submit}>
            {t('labSubmit')}
          </button>
        </div>
      ) : (
        <RoundResult
          points={result.points}
          explanation={t('labDistanceResult', {
            truth: Math.round(result.truth).toLocaleString(locale),
            guess: Math.round(guess).toLocaleString(locale),
          })}
          onNext={next}
        />
      )}
    </div>
  )
}
