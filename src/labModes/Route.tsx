import { useMemo, useState } from 'react'
import type { GeoProjection } from 'd3-geo'
import { WorldMap, type CountryFeature } from '../WorldMap'
import { useLocale } from '../i18n'
import type { Locale } from '../i18n/types'
import { FlatMap } from './FlatMap'
import { RoundResult } from './RoundResult'
import { distanceKm, greatCirclePoints, type LonLat } from './geo'
import {
  meanDeviationKm,
  pathLengthKm,
  pixelsToLonLat,
  resampleLonLat,
  scoreRouteError,
  snapOk,
} from './routeLogic'
import { ROUTE_PAIRS, type RoutePair } from './routePairs'

type Props = {
  countries: CountryFeature[]
  onScored: (points: number) => void
}

function pickPair(): RoutePair {
  return ROUTE_PAIRS[Math.floor(Math.random() * ROUTE_PAIRS.length)]!
}

function nameOf(pair: RoutePair, which: 'from' | 'to', locale: Locale): string {
  return pair[which].name[locale] ?? pair[which].name.de
}

export function Route({ countries, onScored }: Props) {
  const { locale, t } = useLocale()
  const [pair, setPair] = useState(pickPair)
  const [projection, setProjection] = useState<GeoProjection | null>(null)
  const [hint, setHint] = useState('')
  const [result, setResult] = useState<{
    points: number
    err: number
    gcKm: number
    straightKm: number
  } | null>(null)
  const [showGlobe, setShowGlobe] = useState(false)

  const start = pair.from.lonlat
  const end = pair.to.lonlat
  const gcLine = useMemo(() => greatCirclePoints(start, end, 80), [start, end])

  const startPx = useMemo(() => {
    if (!projection) return null
    const p = projection(start)
    return p ? ([p[0]!, p[1]!] as [number, number]) : null
  }, [projection, start])
  const endPx = useMemo(() => {
    if (!projection) return null
    const p = projection(end)
    return p ? ([p[0]!, p[1]!] as [number, number]) : null
  }, [projection, end])

  const onStroke = (pixels: [number, number][]) => {
    if (!projection || !startPx || !endPx) return
    if (!snapOk(pixels, startPx, endPx)) {
      setHint(t('labRouteSnapHint'))
      return
    }
    setHint('')
    const drawn = resampleLonLat(pixelsToLonLat(pixels, projection), 200)
    const gc = greatCirclePoints(start, end, 200)
    const err = meanDeviationKm(drawn, gc)
    const points = scoreRouteError(err)
    const straight = resampleLonLat([start, end] as LonLat[], 200)
    setResult({
      points,
      err,
      gcKm: distanceKm(start, end),
      straightKm: pathLengthKm(straight),
    })
    onScored(points)
  }

  const next = () => {
    setPair(pickPair())
    setResult(null)
    setHint('')
    setShowGlobe(false)
  }

  return (
    <div className={`lab-mode lab-route ${showGlobe ? 'is-globe' : ''}`}>
      <p className="lab-prompt">
        {t('labRoutePrompt', { from: nameOf(pair, 'from', locale), to: nameOf(pair, 'to', locale) })}
      </p>
      <div className="lab-route-stage">
        <div className={`lab-route-flat ${showGlobe ? 'is-fade' : ''}`}>
          <FlatMap
            countries={countries}
            lockedProjection="mercator"
            showProjectionPicker={false}
            drawMode={!result}
            onStrokeComplete={onStroke}
            onProjectionChange={(p) => setProjection(p)}
          >
            {({ projection: proj }) => {
              const s = proj(start)
              const e = proj(end)
              return (
                <g>
                  {s ? <circle cx={s[0]} cy={s[1]} r={5} className="lab-route-marker" /> : null}
                  {e ? <circle cx={e[0]} cy={e[1]} r={5} className="lab-route-marker" /> : null}
                  {result
                    ? gcLine.map((p, i) => {
                        if (i === 0) return null
                        const a = proj(gcLine[i - 1]!)
                        const b = proj(p)
                        if (!a || !b) return null
                        return (
                          <line key={`g${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="lab-gc-line" />
                        )
                      })
                    : null}
                  {result && s && e ? (
                    <line x1={s[0]} y1={s[1]} x2={e[0]} y2={e[1]} className="lab-straight-line" />
                  ) : null}
                </g>
              )
            }}
          </FlatMap>
        </div>
        {showGlobe ? (
          <div className="lab-route-globe">
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
              markers={[
                { id: 's', lonlat: start },
                { id: 'e', lonlat: end },
              ]}
              pathCoords={gcLine}
            />
          </div>
        ) : null}
      </div>
      {hint ? <p className="lab-hint">{hint}</p> : null}
      {result ? (
        <RoundResult
          points={result.points}
          explanation={t('labRouteResult', {
            err: Math.round(result.err).toLocaleString(locale),
            gc: Math.round(result.gcKm).toLocaleString(locale),
            straight: Math.round(result.straightKm).toLocaleString(locale),
          })}
          onNext={next}
          extra={
            !showGlobe ? (
              <button type="button" className="cta cta-secondary" onClick={() => setShowGlobe(true)}>
                {t('labRouteViewGlobe')}
              </button>
            ) : null
          }
        />
      ) : null}
    </div>
  )
}
