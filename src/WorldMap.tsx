import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { geoCentroid, geoGraticule10, geoOrthographic, geoPath, type GeoProjection } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { COUNTRY_NAMES_DE, EXCLUDED_IDS } from './countryNames'
import type { ContinentFilter } from './continents'
import type { RegionFeature } from './admin1'
import type { CityFeature } from './cities'

export type CountryFeature = Feature<Geometry, { name: string }> & { id?: string | number }

type WorldTopology = Topology<{ countries: GeometryCollection }>

type Feedback = 'idle' | 'correct' | 'wrong'
type SelectMode = 'country' | 'region' | 'city'

type GlobeView = {
  rotate: [number, number, number]
  scale: number
  clipAngle: number
}

type Props = {
  targetId: string | null
  feedback: Feedback
  wrongId: string | null
  onSelect: (id: string) => void
  interactive: boolean
  activeIds: Set<string> | null
  focus: ContinentFilter
  /** Land, in das hineingezoomt wird (Regionen-Modus) */
  zoomCountry: CountryFeature | null
  regions: RegionFeature[] | null
  targetRegionId: string | null
  wrongRegionId: string | null
  cities: CityFeature[] | null
  targetCityId: string | null
  wrongCityId: string | null
  selectMode: SelectMode
  /** Langsame Idle-Drehung (z. B. Startseite) */
  autoRotate?: boolean
}

const SPIN_MS = 2200
const DRAG_THRESHOLD = 8
/** Grad pro Sekunde Idle-Rotation auf der Startseite */
const IDLE_SPIN_DEG_PER_SEC = 9
const USER_ZOOM_MIN = 0.55
const USER_ZOOM_MAX = 4.2
const USER_ZOOM_STEP = 1.22

function clampUserZoom(z: number): number {
  return Math.max(USER_ZOOM_MIN, Math.min(USER_ZOOM_MAX, z))
}

function withUserZoom(base: GlobeView, userZoom: number): GlobeView {
  if (userZoom === 1) return base
  return {
    ...base,
    scale: base.scale * userZoom,
    clipAngle: Math.max(12, Math.min(90, base.clipAngle / Math.pow(userZoom, 0.55))),
  }
}

const GLOBE_PRESETS: Record<
  ContinentFilter,
  { rotate: [number, number, number]; scaleMul: number; clipAngle: number }
> = {
  all: { rotate: [20, -8, 0], scaleMul: 0.92, clipAngle: 90 },
  africa: { rotate: [-20, -2, 0], scaleMul: 2.15, clipAngle: 48 },
  asia: { rotate: [-90, -25, 0], scaleMul: 1.85, clipAngle: 52 },
  europe: { rotate: [-15, -48, 0], scaleMul: 3.4, clipAngle: 32 },
  northamerica: { rotate: [100, -40, 0], scaleMul: 2.05, clipAngle: 50 },
  southamerica: { rotate: [60, 22, 0], scaleMul: 2.45, clipAngle: 42 },
  oceania: { rotate: [-145, 28, 0], scaleMul: 2.6, clipAngle: 40 },
}

function normalizeId(id: string | number | undefined): string {
  if (id === undefined) return ''
  return String(id).padStart(3, '0')
}

export function getPlayableCountries(features: CountryFeature[]): CountryFeature[] {
  return features.filter((f) => {
    const id = normalizeId(f.id)
    return id && COUNTRY_NAMES_DE[id] && !EXCLUDED_IDS.has(id)
  })
}

export function countryLabel(feature: CountryFeature): string {
  const id = normalizeId(feature.id)
  return COUNTRY_NAMES_DE[id] ?? feature.properties.name
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

function easeZoom(t: number): number {
  const delayed = Math.max(0, (t - 0.12) / 0.88)
  return easeInOutQuart(delayed)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function shortestAngleDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180
}

function spinDelta(from: number, to: number, turns: number): number {
  return shortestAngleDelta(from, to) + turns * 360
}

function resolveContinentView(size: { w: number; h: number }, focus: ContinentFilter): GlobeView {
  const preset = GLOBE_PRESETS[focus]
  const base = Math.min(size.w, size.h) / 2
  return {
    rotate: [...preset.rotate] as [number, number, number],
    scale: base * preset.scaleMul,
    clipAngle: preset.clipAngle,
  }
}

function resolveCountryView(
  size: { w: number; h: number },
  country: CountryFeature,
): GlobeView {
  const [lon, lat] = geoCentroid(country)
  const rotate: [number, number, number] = [-lon, -lat, 0]
  const fitted = geoOrthographic()
    .precision(0.3)
    .rotate(rotate)
    .fitExtent(
      [
        [28, 28],
        [size.w - 28, size.h - 28],
      ],
      country,
    )
  const scale = fitted.scale()
  const base = Math.min(size.w, size.h) / 2
  const clipAngle = Math.max(14, Math.min(48, (base / scale) * 95))
  return { rotate, scale, clipAngle }
}

function makeProjection(size: { w: number; h: number }, view: GlobeView): GeoProjection {
  return geoOrthographic()
    .precision(0.35)
    .rotate(view.rotate)
    .scale(view.scale)
    .translate([size.w / 2, size.h / 2])
    .clipAngle(view.clipAngle)
}

function clampLat(phi: number): number {
  return Math.max(-78, Math.min(78, phi))
}

function viewKey(focus: ContinentFilter, zoomCountry: CountryFeature | null): string {
  if (zoomCountry) return `country:${normalizeId(zoomCountry.id)}`
  return `focus:${focus}`
}

export function WorldMap({
  targetId,
  feedback,
  wrongId,
  onSelect,
  interactive,
  activeIds,
  focus,
  zoomCountry,
  regions,
  targetRegionId,
  wrongRegionId,
  cities,
  targetCityId,
  wrongCityId,
  selectMode,
  autoRotate = false,
}: Props) {
  const [countries, setCountries] = useState<CountryFeature[]>([])
  const [hovered, setHovered] = useState<string | null>(null)
  const [size, setSize] = useState({ w: 960, h: 560 })
  const [view, setView] = useState<GlobeView>(() => resolveContinentView({ w: 960, h: 560 }, 'all'))
  const [zooming, setZooming] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [userZoom, setUserZoom] = useState(1)

  const wrapRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number | null>(null)
  const inertiaRef = useRef<number | null>(null)
  const idleRef = useRef<number | null>(null)
  const viewRef = useRef<GlobeView>(view)
  const keyRef = useRef(viewKey(focus, zoomCountry))
  const sizeRef = useRef(size)
  const dragRef = useRef<{
    pointerId: number
    x: number
    y: number
    moved: boolean
    vx: number
    vy: number
    lastX: number
    lastY: number
    lastT: number
  } | null>(null)
  const pendingIdRef = useRef<string | null>(null)

  const stopInertia = () => {
    if (inertiaRef.current !== null) {
      cancelAnimationFrame(inertiaRef.current)
      inertiaRef.current = null
    }
  }

  const stopIdleSpin = () => {
    if (idleRef.current !== null) {
      cancelAnimationFrame(idleRef.current)
      idleRef.current = null
    }
  }

  const stopScriptedAnim = () => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    setZooming(false)
  }

  const commitView = (next: GlobeView) => {
    viewRef.current = next
    setView({
      scale: next.scale,
      clipAngle: next.clipAngle,
      rotate: [...next.rotate] as [number, number, number],
    })
  }

  const targetViewFor = (
    sizeNow: { w: number; h: number },
    focusNow: ContinentFilter,
    zoomNow: CountryFeature | null,
  ) => {
    if (zoomNow) return resolveCountryView(sizeNow, zoomNow)
    return resolveContinentView(sizeNow, focusNow)
  }

  useEffect(() => {
    let cancelled = false
    fetch('/countries-110m.json')
      .then((r) => r.json())
      .then((topo: WorldTopology) => {
        if (cancelled) return
        const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>
        setCountries(fc.features as CountryFeature[])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width
      if (width < 10) return
      const next = { w: width, h: Math.max(340, width * 0.58) }
      const prev = sizeRef.current
      if (Math.abs(prev.w - next.w) < 1 && Math.abs(prev.h - next.h) < 1) return
      sizeRef.current = next
      setSize(next)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (animRef.current !== null) return
    const next = targetViewFor(size, focus, zoomCountry)
    commitView({
      rotate: [...viewRef.current.rotate] as [number, number, number],
      scale: next.scale,
      clipAngle: next.clipAngle,
    })
  }, [size])

  const focusKey = viewKey(focus, zoomCountry)
  const zoomCountryRef = useRef(zoomCountry)
  zoomCountryRef.current = zoomCountry
  const focusRef = useRef(focus)
  focusRef.current = focus

  useEffect(() => {
    const nextKey = focusKey
    if (keyRef.current === nextKey) {
      // Verhindert hängenden Zoom-Schleier nach abgebrochener Animation
      setZooming(false)
      return
    }

    const fromKey = keyRef.current
    const focusNow = focusRef.current
    const zoomNow = zoomCountryRef.current
    stopInertia()
    const from = {
      ...viewRef.current,
      rotate: [...viewRef.current.rotate] as [number, number, number],
    }
    const target = targetViewFor(sizeRef.current, focusNow, zoomNow)

    const lonTurns = fromKey.startsWith('focus:all') || nextKey.startsWith('focus:all') ? 1.15 : 0.85
    const dLon = spinDelta(from.rotate[0], target.rotate[0], lonTurns)
    const dLat = shortestAngleDelta(from.rotate[1], target.rotate[1])
    const dRoll = shortestAngleDelta(from.rotate[2], target.rotate[2]) + 12

    stopScriptedAnim()
    setZooming(true)
    const start = performance.now()
    let alive = true

    const tick = (now: number) => {
      if (!alive) return
      const t = Math.min(1, (now - start) / SPIN_MS)
      const spinE = easeInOutQuart(t)
      const zoomE = easeZoom(t)

      const next: GlobeView = {
        rotate: [
          from.rotate[0] + dLon * spinE,
          from.rotate[1] + dLat * spinE,
          from.rotate[2] + dRoll * spinE,
        ],
        scale: lerp(from.scale, target.scale, zoomE),
        clipAngle: lerp(from.clipAngle, target.clipAngle, zoomE),
      }

      if (t < 0.3) {
        const bulge = Math.sin((t / 0.3) * Math.PI) * 0.1
        next.scale = next.scale * (1 - bulge)
      }

      commitView(next)

      if (t < 1) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        animRef.current = null
        const settled = targetViewFor(
          sizeRef.current,
          focusRef.current,
          zoomCountryRef.current,
        )
        commitView(settled)
        keyRef.current = nextKey
        setZooming(false)
      }
    }

    animRef.current = requestAnimationFrame(tick)

    return () => {
      alive = false
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current)
        animRef.current = null
      }
      setZooming(false)
    }
  }, [focusKey])

  useEffect(() => {
    setUserZoom(1)
  }, [focusKey])

  useEffect(() => {
    stopIdleSpin()
    if (!autoRotate || zooming || dragging || zoomCountry) return

    let last = performance.now()
    const tick = (now: number) => {
      // Während Zoom-Animation oder Drag pausieren
      if (animRef.current !== null || dragRef.current) {
        last = now
        idleRef.current = requestAnimationFrame(tick)
        return
      }
      const dt = Math.min(48, now - last)
      last = now
      const cur = viewRef.current
      commitView({
        ...cur,
        rotate: [
          cur.rotate[0] + (IDLE_SPIN_DEG_PER_SEC * dt) / 1000,
          cur.rotate[1],
          cur.rotate[2],
        ],
      })
      idleRef.current = requestAnimationFrame(tick)
    }

    idleRef.current = requestAnimationFrame(tick)
    return () => stopIdleSpin()
  }, [autoRotate, zooming, dragging, focusKey])

  const startInertia = (vx: number, vy: number) => {
    stopInertia()
    let velX = vx
    let velY = vy
    const sens = 0.28

    const step = () => {
      if (Math.abs(velX) < 0.02 && Math.abs(velY) < 0.02) {
        inertiaRef.current = null
        return
      }
      const cur = viewRef.current
      commitView({
        ...cur,
        rotate: [
          cur.rotate[0] + velX * sens,
          clampLat(cur.rotate[1] - velY * sens),
          cur.rotate[2],
        ],
      })
      velX *= 0.945
      velY *= 0.945
      inertiaRef.current = requestAnimationFrame(step)
    }

    inertiaRef.current = requestAnimationFrame(step)
  }

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (zooming) return
    if (e.button !== 0 && e.pointerType === 'mouse') return

    stopInertia()
    stopScriptedAnim()
    keyRef.current = viewKey(focus, zoomCountry)

    const target = e.target as Element | null
    const hit = target?.closest?.('[data-hit-id]')
    const hitId = hit?.getAttribute('data-hit-id')
    const hitKind = hit?.getAttribute('data-hit-kind')
    const expectedKind =
      selectMode === 'region' ? 'region' : selectMode === 'city' ? 'city' : 'country'

    if (hitId && hitKind === expectedKind) {
      if (selectMode === 'country') {
        const ok = !activeIds || activeIds.has(hitId)
        pendingIdRef.current = ok ? hitId : null
      } else {
        pendingIdRef.current = hitId
      }
    } else {
      pendingIdRef.current = null
    }

    dragRef.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      vx: 0,
      vy: 0,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: performance.now(),
    }
  }

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      drag.moved = true
      pendingIdRef.current = null
      drag.x = e.clientX
      drag.y = e.clientY
      drag.lastX = e.clientX
      drag.lastY = e.clientY
      drag.lastT = performance.now()
      setDragging(true)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      return
    }
    if (!drag.moved) return

    const now = performance.now()
    const dt = Math.max(8, now - drag.lastT)
    const frameDx = e.clientX - drag.x
    const frameDy = e.clientY - drag.y
    drag.vx = ((e.clientX - drag.lastX) / dt) * 16
    drag.vy = ((e.clientY - drag.lastY) / dt) * 16
    drag.lastX = e.clientX
    drag.lastY = e.clientY
    drag.lastT = now
    drag.x = e.clientX
    drag.y = e.clientY

    const sens = 0.35
    const cur = viewRef.current
    commitView({
      ...cur,
      rotate: [
        cur.rotate[0] + frameDx * sens,
        clampLat(cur.rotate[1] - frameDy * sens),
        cur.rotate[2],
      ],
    })
  }

  const endDrag = (e: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return

    const moved = drag.moved
    const toSelect = pendingIdRef.current
    dragRef.current = null
    pendingIdRef.current = null
    setDragging(false)

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      /* ignore */
    }

    if (moved) {
      startInertia(drag.vx, drag.vy)
      return
    }

    if (toSelect && interactive) onSelect(toSelect)
  }

  const { sphere, graticule, countryPaths, regionPaths, cityMarkers } = useMemo(() => {
    const projection = makeProjection(size, withUserZoom(view, userZoom))
    const generator = geoPath(projection)
    const grat = geoGraticule10()
    return {
      sphere: generator({ type: 'Sphere' }) ?? '',
      graticule: generator(grat) ?? '',
      countryPaths: countries.map((c) => ({
        id: normalizeId(c.id),
        d: generator(c) ?? '',
        feature: c,
      })),
      regionPaths: (regions ?? []).map((r) => ({
        id: r.properties.id,
        d: generator(r) ?? '',
        feature: r,
      })),
      cityMarkers: (cities ?? [])
        .map((c) => {
          const coords = projection(c.geometry.coordinates as [number, number])
          if (!coords) return null
          return {
            id: c.properties.id,
            x: coords[0],
            y: coords[1],
            rank: c.properties.rank,
          }
        })
        .filter((m): m is NonNullable<typeof m> => m !== null),
    }
  }, [countries, regions, cities, size, view, userZoom])

  useEffect(
    () => () => {
      stopInertia()
      stopScriptedAnim()
      stopIdleSpin()
    },
    [],
  )

  const showRegions = selectMode === 'region' && regionPaths.length > 0
  const showCities = selectMode === 'city' && cityMarkers.length > 0
  const countryZoom = selectMode === 'region' || selectMode === 'city'
  const canZoomIn = userZoom < USER_ZOOM_MAX - 0.01
  const canZoomOut = userZoom > USER_ZOOM_MIN + 0.01

  const nudgeZoom = (direction: 1 | -1) => {
    setUserZoom((z) =>
      clampUserZoom(direction > 0 ? z * USER_ZOOM_STEP : z / USER_ZOOM_STEP),
    )
  }

  return (
    <div
      className={`map-shell ${zooming ? 'is-zooming' : ''} ${dragging ? 'is-dragging' : ''}`}
      ref={wrapRef}
    >
      <div className="map-glow" aria-hidden />
      <div className="map-zoom-veil" aria-hidden />
      <div className="map-zoom-streak" aria-hidden />
      <p className="map-hint">Ziehen zum Drehen · +/− zoomt</p>

      <div className="map-zoom-controls" role="group" aria-label="Zoom">
        <button
          type="button"
          className="map-zoom-btn"
          onClick={() => nudgeZoom(1)}
          disabled={!canZoomIn || zooming}
          aria-label="Heranzoomen"
        >
          +
        </button>
        <button
          type="button"
          className="map-zoom-btn"
          onClick={() => nudgeZoom(-1)}
          disabled={!canZoomOut || zooming}
          aria-label="Herauszoomen"
        >
          −
        </button>
      </div>

      <svg
        className="world-map world-globe"
        viewBox={`0 0 ${size.w} ${size.h}`}
        role="img"
        aria-label="Interaktiver Globus"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <defs>
          <radialGradient id="ocean" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#1a4a5c" />
            <stop offset="55%" stopColor="#0d2a38" />
            <stop offset="100%" stopColor="#071820" />
          </radialGradient>
          <linearGradient id="land" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8d9b8" />
            <stop offset="100%" stopColor="#c4b089" />
          </linearGradient>
          <linearGradient id="regionFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#edd9b0" />
            <stop offset="100%" stopColor="#c9b48a" />
          </linearGradient>
          <radialGradient id="globeShade" cx="32%" cy="28%" r="75%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
          </radialGradient>
        </defs>

        <path className="ocean" d={sphere} fill="url(#ocean)" pointerEvents="none" />
        <path
          className="graticule"
          d={graticule}
          fill="none"
          stroke="rgba(160,210,220,0.12)"
          strokeWidth={0.55}
          pointerEvents="none"
        />

        <g className="countries-layer">
          {countryPaths.map(({ id, d, feature: c }) => {
            if (!d) return null
            const isActive = !activeIds || activeIds.has(id)
            const isZoomed = zoomCountry ? normalizeId(zoomCountry.id) === id : false
            const isTarget = !countryZoom && targetId === id
            const isWrong = !countryZoom && wrongId === id
            const isHover =
              !countryZoom && hovered === id && interactive && isActive && !dragging

            let className = 'country'
            if (countryZoom) {
              if (showCities && regionPaths.length === 0) {
                className += isZoomed ? ' is-city-host' : ' is-muted'
              } else {
                className += isZoomed ? ' is-region-host' : ' is-muted'
              }
            } else if (!isActive) className += ' is-muted'
            else if (feedback === 'correct' && isTarget) className += ' is-correct'
            else if (feedback === 'wrong' && isTarget) className += ' is-reveal'
            else if (isWrong) className += ' is-wrong'
            else if (isHover) className += ' is-hover'

            return (
              <path
                key={id || c.properties.name}
                className={className}
                d={d}
                fill="url(#land)"
                data-hit-id={countryZoom ? undefined : id}
                data-hit-kind={countryZoom ? undefined : 'country'}
                onMouseEnter={() =>
                  !countryZoom && interactive && isActive && !dragging && setHovered(id)
                }
                onMouseLeave={() => setHovered(null)}
              >
                <title>{countryLabel(c)}</title>
              </path>
            )
          })}
        </g>

        {showRegions || (showCities && regionPaths.length > 0) ? (
          <g className="regions-layer">
            {regionPaths.map(({ id, d, feature: r }) => {
              if (!d) return null
              const isTarget = showRegions && targetRegionId === id
              const isWrong = showRegions && wrongRegionId === id
              const isHover = showRegions && hovered === id && interactive && !dragging

              let className = 'region'
              if (showCities) className += ' is-city-backdrop'
              else if (feedback === 'correct' && isTarget) className += ' is-correct'
              else if (feedback === 'wrong' && isTarget) className += ' is-reveal'
              else if (isWrong) className += ' is-wrong'
              else if (isHover) className += ' is-hover'

              return (
                <path
                  key={id}
                  className={className}
                  d={d}
                  fill="url(#regionFill)"
                  data-hit-id={showRegions ? id : undefined}
                  data-hit-kind={showRegions ? 'region' : undefined}
                  onMouseEnter={() =>
                    showRegions && interactive && !dragging && setHovered(id)
                  }
                  onMouseLeave={() => setHovered(null)}
                >
                  <title>{r.properties.name}</title>
                </path>
              )
            })}
          </g>
        ) : null}

        <path className="globe-shade" d={sphere} fill="url(#globeShade)" pointerEvents="none" />
        <path
          className="globe-rim"
          d={sphere}
          fill="none"
          stroke="rgba(232,217,184,0.3)"
          strokeWidth={1.5}
          pointerEvents="none"
        />

        {showCities ? (
          <g className="cities-layer">
            {cityMarkers.map(({ id, x, y, rank }) => {
              const isTarget = targetCityId === id
              const isWrong = wrongCityId === id
              const isHover = hovered === id && interactive && !dragging

              let className = 'city-marker'
              if (feedback === 'correct' && isTarget) className += ' is-correct'
              else if (feedback === 'wrong' && isTarget) className += ' is-reveal'
              else if (isWrong) className += ' is-wrong'
              else if (isHover) className += ' is-hover'

              return (
                <g
                  key={id}
                  className={className}
                  transform={`translate(${x}, ${y})`}
                  data-hit-id={id}
                  data-hit-kind="city"
                  onMouseEnter={() => interactive && !dragging && setHovered(id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <circle className="city-dot" r={11} />
                  <text className="city-rank" textAnchor="middle" dy="0.35em">
                    {rank}
                  </text>
                </g>
              )
            })}
          </g>
        ) : null}
      </svg>
    </div>
  )
}

export { normalizeId }
