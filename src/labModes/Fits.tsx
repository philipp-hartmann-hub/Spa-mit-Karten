import { useEffect, useMemo, useState } from 'react'
import { geoCentroid, geoPath } from 'd3-geo'
import type { GeoProjection } from 'd3-geo'
import type { CountryFeature } from '../WorldMap'
import { countryLabel, normalizeId } from '../WorldMap'
import { NUMERIC_TO_A2 } from '../isoAlpha2'
import { useLocale } from '../i18n'
import { FlatMap } from './FlatMap'
import { RoundResult } from './RoundResult'
import { PopulationAttribution } from './PopulationAttribution'
import { loadPopIndex } from './population'
import { pickFitsPair, scoreFitsGuess, type FitsMetric } from './fitsLogic'
import { rotateGeometryTo } from './rotateGeom'

type Props = {
  countries: CountryFeature[]
  metric: FitsMetric
  onScored: (points: number) => void
}

export function Fits({ countries, metric, onScored }: Props) {
  const { locale, t } = useLocale()
  const [popIndex, setPopIndex] = useState<Record<string, number>>({})
  const [pair, setPair] = useState<ReturnType<typeof pickFitsPair>>(null)
  const [guess, setGuess] = useState(5)
  const [result, setResult] = useState<{ points: number } | null>(null)
  const [copies, setCopies] = useState(0)
  const [projection, setProjection] = useState<GeoProjection | null>(null)

  useEffect(() => {
    if (metric === 'population') void loadPopIndex().then(setPopIndex)
  }, [metric])

  useEffect(() => {
    setPair(pickFitsPair(countries, metric, popIndex, (id) => NUMERIC_TO_A2[id]))
    setGuess(5)
    setResult(null)
    setCopies(0)
  }, [countries, metric, popIndex])

  const fitIds = useMemo(() => (pair ? [normalizeId(pair.big.id)] : null), [pair])

  useEffect(() => {
    if (!result || !pair || metric !== 'area') return
    const n = Math.min(48, Math.max(2, Math.round(pair.truth)))
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setCopies(i)
      if (i >= n) window.clearInterval(id)
    }, 100)
    return () => window.clearInterval(id)
  }, [result, pair, metric])

  if (!pair) {
    return <p className="lab-prompt">{t('labFitsNoPair')}</p>
  }

  const submit = () => {
    const points = scoreFitsGuess(guess, pair.truth)
    setResult({ points })
    onScored(points)
  }

  const next = () => {
    setPair(pickFitsPair(countries, metric, popIndex, (id) => NUMERIC_TO_A2[id]))
    setGuess(5)
    setResult(null)
    setCopies(0)
  }

  return (
    <div className="lab-mode">
      <p className="lab-prompt">
        {t('labFitsPrompt', {
          small: countryLabel(pair.small, locale),
          big: countryLabel(pair.big, locale),
        })}
      </p>
      <FlatMap
        countries={countries}
        lockedProjection="equalEarth"
        fitIds={fitIds}
        showProjectionPicker={false}
        onProjectionChange={(p) => setProjection(p)}
      >
        {() => {
          if (!result || !projection || metric !== 'area' || !pair.small.geometry) return null
          const bigC = geoCentroid(pair.big) as [number, number]
          const smallC = geoCentroid(pair.small) as [number, number]
          const cols = Math.ceil(Math.sqrt(Math.max(1, copies)))
          const pathGen = geoPath(projection)
          const nodes = []
          for (let i = 0; i < copies; i++) {
            const row = Math.floor(i / cols)
            const col = i % cols
            const target: [number, number] = [
              bigC[0] + (col - (cols - 1) / 2) * 1.8,
              bigC[1] + (row - (cols - 1) / 2) * 1.2,
            ]
            const geom = rotateGeometryTo(pair.small.geometry, smallC, target)
            const d = pathGen({ type: 'Feature', properties: {}, geometry: geom })
            if (d) nodes.push(<path key={i} d={d} className="lab-fits-copy" />)
          }
          return <g>{nodes}</g>
        }}
      </FlatMap>
      {metric === 'population' ? <PopulationAttribution /> : null}
      {!result ? (
        <div className="lab-controls">
          <label>
            {t('labFitsGuess')}
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={Math.log10(guess)}
              onChange={(e) => setGuess(10 ** Number(e.target.value))}
            />
            <span>× {guess.toFixed(guess >= 10 ? 0 : 1)}</span>
          </label>
          <button type="button" className="cta" onClick={submit}>
            {t('labSubmit')}
          </button>
        </div>
      ) : (
        <RoundResult
          points={result.points}
          explanation={t('labFitsResult', {
            truth: pair.truth.toFixed(1),
            guess: guess.toFixed(1),
          })}
          onNext={next}
        />
      )}
    </div>
  )
}
