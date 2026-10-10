import { useEffect, useMemo, useState } from 'react'
import { geoCentroid } from 'd3-geo'
import type { CountryFeature } from '../WorldMap'
import { countryLabel, normalizeId } from '../WorldMap'
import { biomeFill } from '../biomes'
import type { ContinentFilter } from '../continents'
import { useLocale } from '../i18n'
import { FlatMap } from './FlatMap'
import type { LonLat } from './geo'
import {
  canSnap,
  playablePuzzlePieces,
  readBestTime,
  shuffle,
  writeBestTime,
} from './puzzleLogic'

type Props = {
  countries: CountryFeature[]
  continent: ContinentFilter
  seed?: number
  onFinished?: (result: { timeMs: number; mistakes: number }) => void
}

export function Puzzle({ countries, continent, seed, onFinished }: Props) {
  const { locale, t } = useLocale()
  const pieces = useMemo(() => playablePuzzlePieces(countries), [countries])
  const [tray, setTray] = useState<CountryFeature[]>(() =>
    shuffle(pieces.tray, seed ?? Math.random()),
  )
  const [placed, setPlaced] = useState<Set<string>>(
    () => new Set(pieces.auto.map((c) => normalizeId(c.id))),
  )
  const [active, setActive] = useState<CountryFeature | null>(null)
  const [hoverLonLat, setHoverLonLat] = useState<LonLat | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [started] = useState(() => performance.now())
  const [done, setDone] = useState(false)
  const [best, setBest] = useState<number | null>(() => readBestTime(continent))

  useEffect(() => {
    const p = playablePuzzlePieces(countries)
    setTray(shuffle(p.tray, seed ?? Math.random()))
    setPlaced(new Set(p.auto.map((c) => normalizeId(c.id))))
    setMistakes(0)
    setDone(false)
    setBest(readBestTime(continent))
  }, [countries, continent, seed])

  const fitIds = useMemo(() => countries.map((c) => normalizeId(c.id)), [countries])

  const tryPlace = (feature: CountryFeature, ll: LonLat) => {
    const id = normalizeId(feature.id)
    if (canSnap(ll, feature)) {
      const next = new Set(placed)
      next.add(id)
      setPlaced(next)
      setTray((tr) => tr.filter((c) => normalizeId(c.id) !== id))
      setActive(null)
      setHoverLonLat(null)
      if (next.size >= countries.length) {
        const timeMs = performance.now() - started
        writeBestTime(continent, timeMs)
        setBest(readBestTime(continent))
        setDone(true)
        onFinished?.({ timeMs, mistakes })
      }
    } else {
      setMistakes((m) => m + 1)
      setActive(null)
      setHoverLonLat(null)
    }
  }

  return (
    <div className="lab-mode lab-puzzle">
      <p className="lab-prompt">
        {t('labPuzzlePrompt')} · {t('labPuzzleMistakes', { n: mistakes })}
        {best != null ? ` · ${t('labPuzzleBest', { s: (best / 1000).toFixed(1) })}` : ''}
      </p>
      <div className="lab-puzzle-layout">
        <FlatMap
          countries={countries}
          lockedProjection="equalEarth"
          fitIds={fitIds}
          showProjectionPicker={false}
          coastOnly
          hideBorders
          onMapClick={(ll) => {
            if (active) tryPlace(active, ll)
            else setHoverLonLat(ll)
          }}
        >
          {({ path }) => (
            <g>
              {countries.map((c) => {
                const id = normalizeId(c.id)
                const isIn = placed.has(id)
                const d = path(c)
                if (!d) return null
                return (
                  <g key={id}>
                    <path
                      d={d}
                      className={isIn ? 'lab-puzzle-in' : 'lab-puzzle-slot'}
                      fill={isIn ? biomeFill(id) : 'transparent'}
                    />
                    {isIn ? (
                      <text
                        className="lab-puzzle-label"
                        x={path.centroid(c)[0]}
                        y={path.centroid(c)[1]}
                        textAnchor="middle"
                      >
                        {countryLabel(c, locale)}
                      </text>
                    ) : null}
                  </g>
                )
              })}
              {active && hoverLonLat
                ? (() => {
                    const truth = geoCentroid(active) as LonLat
                    void truth
                    const d = path(active)
                    return d ? <path d={d} className="lab-puzzle-dragging" opacity={0.5} /> : null
                  })()
                : null}
            </g>
          )}
        </FlatMap>
        <div className="lab-puzzle-tray" aria-label={t('labPuzzleTray')}>
          {tray.map((c) => (
            <button
              key={normalizeId(c.id)}
              type="button"
              className={`lab-puzzle-piece ${active && normalizeId(active.id) === normalizeId(c.id) ? 'is-active' : ''}`}
              onClick={() => setActive(c)}
            >
              <span className="lab-puzzle-silhouette" style={{ background: biomeFill(normalizeId(c.id)) }} />
            </button>
          ))}
        </div>
      </div>
      {done ? <p className="lab-prompt">{t('labPuzzleDone')}</p> : null}
    </div>
  )
}
