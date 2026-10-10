import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { geoCentroid, geoPath } from 'd3-geo'
import type { GeoProjection } from 'd3-geo'
import type { CountryFeature } from '../WorldMap'
import { countryLabel, normalizeId } from '../WorldMap'
import { useLocale } from '../i18n'
import { FlatMap } from './FlatMap'
import { RoundResult } from './RoundResult'
import { distanceKm, type LonLat } from './geo'
import { neighborIds, placeGeometryAt, scorePlace, type PlaceDifficulty } from './placeLogic'

type Props = {
  countries: CountryFeature[]
  difficulty: PlaceDifficulty
  onScored: (points: number) => void
}

function pick(countries: CountryFeature[]): CountryFeature {
  return countries[Math.floor(Math.random() * countries.length)]!
}

export function Place({ countries, difficulty, onScored }: Props) {
  const { locale, t } = useLocale()
  const [target, setTarget] = useState(() => pick(countries))
  const [placed, setPlaced] = useState<LonLat | null>(null)
  const [dragging, setDragging] = useState(false)
  const [projection, setProjection] = useState<GeoProjection | null>(null)
  const [result, setResult] = useState<{ points: number; truth: LonLat; guess: LonLat } | null>(
    null,
  )
  const dragRef = useRef(false)

  const neighbors = useMemo(
    () => (difficulty === 'easy' ? neighborIds(target, countries) : null),
    [difficulty, target, countries],
  )
  const truth = useMemo(() => geoCentroid(target) as LonLat, [target])

  const onMapPointer = (e: ReactPointerEvent) => {
    if (!projection || result) return
    const svg = (e.target as Element).closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const inv = projection.invert?.([x, y])
    if (inv) setPlaced([inv[0], inv[1]])
  }

  const submit = () => {
    if (!placed) return
    const points = scorePlace(placed, truth)
    setResult({ points, truth, guess: placed })
    onScored(points)
  }

  const next = () => {
    setTarget(pick(countries))
    setPlaced(null)
    setResult(null)
  }

  return (
    <div className="lab-mode">
      <p className="lab-prompt">{t('labPlacePrompt', { country: countryLabel(target, locale) })}</p>
      <div className="lab-place-layout">
        <div
          className="lab-place-dock"
          onPointerDown={() => {
            dragRef.current = true
            setDragging(true)
          }}
        >
          <span>{countryLabel(target, locale)}</span>
          <p className="lab-hint">{t('labPlaceDockHint')}</p>
        </div>
        <div
          onPointerMove={(e) => {
            if (dragRef.current || dragging) onMapPointer(e)
          }}
          onPointerUp={() => {
            dragRef.current = false
            setDragging(false)
          }}
        >
          <FlatMap
            countries={countries}
            lockedProjection="mercator"
            showProjectionPicker={false}
            coastOnly={difficulty !== 'easy'}
            hideBorders={difficulty !== 'easy'}
            showGraticule={difficulty !== 'hard'}
            neighborHighlightIds={neighbors}
            onProjectionChange={(p) => setProjection(p)}
            onMapClick={(ll) => {
              if (!result) setPlaced(ll)
            }}
          >
            {({ projection: proj, path }) => {
              if (!placed || !target.geometry) return null
              const geom = placeGeometryAt(target, placed)
              if (!geom) return null
              const d = geoPath(proj)({ type: 'Feature', properties: {}, geometry: geom })
              const truthPx = proj(truth)
              const guessPx = proj(placed)
              return (
                <g>
                  {d ? <path d={d} className="lab-place-ghost" /> : null}
                  {result && truthPx && guessPx ? (
                    <>
                      <path
                        d={path(target) ?? undefined}
                        className="lab-place-truth"
                      />
                      <line
                        x1={guessPx[0]}
                        y1={guessPx[1]}
                        x2={truthPx[0]}
                        y2={truthPx[1]}
                        className="lab-place-arrow"
                      />
                    </>
                  ) : null}
                </g>
              )
            }}
          </FlatMap>
        </div>
      </div>
      {!result ? (
        <div className="lab-controls">
          <button type="button" className="cta" disabled={!placed} onClick={submit}>
            {t('labSubmit')}
          </button>
        </div>
      ) : (
        <RoundResult
          points={result.points}
          explanation={t('labPlaceResult', {
            km: Math.round(distanceKm(result.guess, result.truth)).toLocaleString(locale),
          })}
          onNext={next}
        />
      )}
      <span className="u-hide">{normalizeId(target.id)}</span>
    </div>
  )
}
