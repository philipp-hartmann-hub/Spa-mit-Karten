import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { GeoProjection } from 'd3-geo'
import type { CountryFeature } from '../WorldMap'
import { countryLabel, normalizeId } from '../WorldMap'
import { NUMERIC_TO_A2 } from '../isoAlpha2'
import { useLocale } from '../i18n'
import { FlatMap } from './FlatMap'
import { RoundResult } from './RoundResult'
import { PopulationAttribution } from './PopulationAttribution'
import { loadGrid, type PopPoint } from './population'
import { linearScore } from './geo'
import { projectPoints, share, solve, solveThroughPoint } from './split'
import { loadCities, type CityFeature } from '../cities'

export type SplitRoundKind = 'fixed' | 'anchor' | 'free' | 'world'

type Props = {
  countries: CountryFeature[]
  kind: SplitRoundKind
  seed?: number
  onScored?: (points: number, detail: { absPp: number; submittedAt: number }) => void
}

const FIXED_ANGLES = [0, 45, 90, 135]

export function SplitMode({ countries, kind, seed, onScored }: Props) {
  const { locale, t } = useLocale()
  const [country, setCountry] = useState<CountryFeature | null>(null)
  const [points, setPoints] = useState<PopPoint[]>([])
  const [projection, setProjection] = useState<GeoProjection | null>(null)
  const [theta, setTheta] = useState(0)
  const [offset, setOffset] = useState(0)
  const [anchorCity, setAnchorCity] = useState<CityFeature | null>(null)
  const [result, setResult] = useState<{
    points: number
    left: number
    truthOffset: number
    absPp: number
  } | null>(null)
  const dragRef = useRef<{ mode: 'move' | 'rotate'; x: number; y: number; theta: number; offset: number } | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      if (kind === 'world') {
        const grid = await loadGrid('world')
        if (cancelled) return
        setCountry(null)
        setPoints(grid)
        setTheta((((seed ?? Math.random()) * 180) % 180) * (Math.PI / 180))
        return
      }
      const c = countries[Math.floor((seed ?? Math.random()) * countries.length)]!
      const a2 = NUMERIC_TO_A2[normalizeId(c.id)]
      const grid = a2 ? await loadGrid(a2) : []
      if (cancelled) return
      setCountry(c)
      setPoints(grid)
      if (kind === 'fixed') {
        const ang = FIXED_ANGLES[Math.floor((seed ?? Math.random()) * FIXED_ANGLES.length)]!
        setTheta((ang * Math.PI) / 180)
      } else {
        setTheta(0)
      }
      if (kind === 'anchor') {
        const cities = await loadCities()
        const list = cities.filter((x) => x.properties.countryId === normalizeId(c.id))
        setAnchorCity(list[0] ?? cities[0] ?? null)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [countries, kind, seed])

  const xy = useMemo(
    () => (projection ? projectPoints(points, projection) : []),
    [points, projection],
  )

  useEffect(() => {
    if (!xy.length || result) return
    if (kind === 'anchor' && anchorCity && projection) {
      const p = projection(anchorCity.geometry.coordinates as [number, number])
      if (p) {
        const th = solveThroughPoint(xy, { x: p[0]!, y: p[1]! })
        setTheta(th)
        const nx = Math.cos(th)
        const ny = Math.sin(th)
        setOffset(p[0]! * nx + p[1]! * ny)
      }
      return
    }
    setOffset(solve(xy, theta))
  }, [xy, kind, anchorCity, projection]) // eslint-disable-line react-hooks/exhaustive-deps

  const fitIds = country ? [normalizeId(country.id)] : null

  const onPointerDown = (e: ReactPointerEvent, mode: 'move' | 'rotate') => {
    if (result) return
    dragRef.current = { mode, x: e.clientX, y: e.clientY, theta, offset }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (d.mode === 'rotate' || kind === 'anchor' || kind === 'free') {
      if (d.mode === 'rotate' || kind === 'anchor') {
        setTheta(d.theta + dx * 0.005)
        if (kind === 'anchor' && anchorCity && projection) {
          const p = projection(anchorCity.geometry.coordinates as [number, number])
          if (p) {
            const nx = Math.cos(theta)
            const ny = Math.sin(theta)
            setOffset(p[0]! * nx + p[1]! * ny)
          }
        }
      }
    }
    if (d.mode === 'move' && kind !== 'anchor') {
      const nx = Math.cos(d.theta)
      const ny = Math.sin(d.theta)
      setOffset(d.offset + dx * nx + dy * ny)
    }
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const submit = () => {
    const left = share(xy, theta, offset)
    const truthOffset = solve(xy, theta)
    const truthLeft = 0.5
    const absPp = Math.abs(left - truthLeft) * 100
    const points = linearScore(absPp, 0, 15)
    setResult({ points, left, truthOffset, absPp })
    onScored?.(points, { absPp, submittedAt: Date.now() })
  }

  const next = () => {
    setResult(null)
    // re-trigger effect
    setPoints([])
    setCountry(null)
  }

  return (
    <div className="lab-mode">
      <p className="lab-prompt">
        {kind === 'world'
          ? t('labSplitWorld')
          : t('labSplitPrompt', { country: country ? countryLabel(country, locale) : '…' })}
      </p>
      <div
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <FlatMap
          countries={countries}
          lockedProjection="equalEarth"
          fitIds={fitIds}
          showProjectionPicker={false}
          onProjectionChange={(p) => setProjection(p)}
        >
          {({ projection: proj, path }) => {
            if (!xy.length) return null
            const nx = Math.cos(theta)
            const ny = Math.sin(theta)
            // line through offset along tangent
            const tx = -ny
            const ty = nx
            const cx = nx * offset
            const cy = ny * offset
            const x1 = cx - tx * 2000
            const y1 = cy - ty * 2000
            const x2 = cx + tx * 2000
            const y2 = cy + ty * 2000
            const clipId = 'split-clip'
            const countryPath = country ? path(country) : null
            return (
              <g>
                {countryPath ? (
                  <defs>
                    <clipPath id={clipId}>
                      <path d={countryPath} />
                    </clipPath>
                  </defs>
                ) : null}
                <g clipPath={countryPath ? `url(#${clipId})` : undefined}>
                  <rect
                    x={0}
                    y={0}
                    width={9999}
                    height={9999}
                    className="lab-split-side-a"
                    style={{
                      transform: `rotate(${(theta * 180) / Math.PI}deg)`,
                      transformOrigin: `${cx}px ${cy}px`,
                    }}
                  />
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className="lab-split-line"
                    onPointerDown={(e) => onPointerDown(e, 'move')}
                    style={{ touchAction: 'none' }}
                  />
                  {result ? (
                    <line
                      x1={nx * result.truthOffset - tx * 2000}
                      y1={ny * result.truthOffset - ty * 2000}
                      x2={nx * result.truthOffset + tx * 2000}
                      y2={ny * result.truthOffset + ty * 2000}
                      className="lab-split-truth"
                    />
                  ) : null}
                </g>
                {kind === 'free' ? (
                  <circle
                    cx={cx + tx * 40}
                    cy={cy + ty * 40}
                    r={10}
                    className="lab-split-handle"
                    onPointerDown={(e) => onPointerDown(e, 'rotate')}
                  />
                ) : null}
                {anchorCity
                  ? (() => {
                      const p = proj(anchorCity.geometry.coordinates as [number, number])
                      return p ? <circle cx={p[0]} cy={p[1]} r={4} className="lab-route-marker" /> : null
                    })()
                  : null}
              </g>
            )
          }}
        </FlatMap>
      </div>
      <PopulationAttribution />
      {!result ? (
        <div className="lab-controls">
          <button type="button" className="cta" onClick={submit} disabled={!xy.length}>
            {t('labSubmit')}
          </button>
        </div>
      ) : (
        <RoundResult
          points={result.points}
          explanation={t('labSplitResult', {
            left: (result.left * 100).toFixed(1),
            right: ((1 - result.left) * 100).toFixed(1),
            pp: result.absPp.toFixed(1),
          })}
          onNext={next}
        />
      )}
    </div>
  )
}
