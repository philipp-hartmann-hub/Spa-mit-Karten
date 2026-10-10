import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import {
  geoEqualEarth,
  geoEquirectangular,
  geoGraticule,
  geoMercator,
  geoPath,
  type GeoProjection,
} from 'd3-geo'
import { biomeFill } from '../biomes'
import { normalizeId, type CountryFeature } from '../WorldMap'
import { useLocale } from '../i18n'

export type FlatProjectionId = 'mercator' | 'equirectangular' | 'equalEarth'

type Props = {
  countries: CountryFeature[]
  projectionId?: FlatProjectionId
  lockedProjection?: FlatProjectionId
  showProjectionPicker?: boolean
  showGraticule?: boolean
  hideBorders?: boolean
  coastOnly?: boolean
  fitIds?: string[] | null
  neighborHighlightIds?: string[] | null
  interactivePanZoom?: boolean
  drawMode?: boolean
  onStrokeComplete?: (pixels: [number, number][]) => void
  onMapClick?: (lonlat: [number, number]) => void
  onProjectionChange?: (projection: GeoProjection, id: FlatProjectionId) => void
  children?: ReactNode | ((ctx: { projection: GeoProjection; path: ReturnType<typeof geoPath> }) => ReactNode)
  className?: string
}

const DRAG_THRESHOLD = 8

function makeProjection(id: FlatProjectionId, w: number, h: number): GeoProjection {
  const base =
    id === 'mercator'
      ? geoMercator()
      : id === 'equirectangular'
        ? geoEquirectangular()
        : geoEqualEarth()
  return base.precision(0.3).translate([w / 2, h / 2]).scale(Math.min(w, h) / 5.2)
}

export function FlatMap({
  countries,
  projectionId: controlledId,
  lockedProjection,
  showProjectionPicker = true,
  showGraticule = true,
  hideBorders = false,
  coastOnly = false,
  fitIds = null,
  neighborHighlightIds = null,
  interactivePanZoom = true,
  drawMode = false,
  onStrokeComplete,
  onMapClick,
  onProjectionChange,
  children,
  className = '',
}: Props) {
  const { t } = useLocale()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 640, h: 360 })
  const [projId, setProjId] = useState<FlatProjectionId>(lockedProjection ?? controlledId ?? 'equalEarth')
  const [translate, setTranslate] = useState<[number, number]>([0, 0])
  const [zoom, setZoom] = useState(1)
  const dragRef = useRef<{
    pointerId: number
    x: number
    y: number
    moved: boolean
    tx: number
    ty: number
    stroke?: [number, number][]
  } | null>(null)
  const [strokePreview, setStrokePreview] = useState<[number, number][] | null>(null)

  useEffect(() => {
    if (lockedProjection) setProjId(lockedProjection)
    else if (controlledId) setProjId(controlledId)
  }, [lockedProjection, controlledId])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      const h = Math.max(280, Math.round(w * 0.55))
      setSize({ w, h })
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: Math.max(280, Math.round(el.clientWidth * 0.55)) })
    return () => ro.disconnect()
  }, [])

  const projection = useMemo(() => {
    const p = makeProjection(projId, size.w, size.h)
    const fit = fitIds?.length
      ? countries.filter((c) => fitIds.includes(normalizeId(c.id)))
      : null
    if (fit && fit.length > 0) {
      p.fitExtent(
        [
          [24, 24],
          [size.w - 24, size.h - 24],
        ],
        { type: 'FeatureCollection', features: fit },
      )
    }
    const [tx, ty] = p.translate()
    p.translate([tx + translate[0], ty + translate[1]])
    p.scale(p.scale() * zoom)
    return p
  }, [projId, size, countries, fitIds, translate, zoom])

  const path = useMemo(() => geoPath(projection), [projection])

  useEffect(() => {
    onProjectionChange?.(projection, projId)
  }, [projection, projId, onProjectionChange])

  const graticule = useMemo(() => geoGraticule()(), [])

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (drawMode) {
      dragRef.current = {
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        moved: true,
        tx: translate[0],
        ty: translate[1],
        stroke: [[x, y]],
      }
      setStrokePreview([[x, y]])
      svg.setPointerCapture(e.pointerId)
      return
    }
    dragRef.current = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      tx: translate[0],
      ty: translate[1],
    }
  }

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (drawMode && drag.stroke) {
      drag.stroke.push([x, y])
      setStrokePreview([...drag.stroke])
      return
    }
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      drag.moved = true
      if (interactivePanZoom) svg.setPointerCapture(e.pointerId)
    }
    if (drag.moved && interactivePanZoom) {
      setTranslate([drag.tx + dx, drag.ty + dy])
    }
  }

  const endPointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    if (drawMode && drag.stroke) {
      onStrokeComplete?.(drag.stroke)
      setStrokePreview(null)
    } else if (!drag.moved && onMapClick) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const inv = projection.invert?.([x, y])
      if (inv) onMapClick([inv[0], inv[1]])
    }
    dragRef.current = null
  }

  const setProjection = useCallback(
    (id: FlatProjectionId) => {
      if (lockedProjection) return
      setProjId(id)
      setTranslate([0, 0])
      setZoom(1)
    },
    [lockedProjection],
  )

  const neighborSet = neighborHighlightIds ? new Set(neighborHighlightIds) : null

  return (
    <div className={`flat-map-shell ${className}`} ref={wrapRef}>
      {showProjectionPicker && !lockedProjection ? (
        <div className="flat-map-proj" role="group" aria-label={t('labProjection')}>
          {(
            [
              ['equalEarth', 'labProjEqualEarth'],
              ['mercator', 'labProjMercator'],
              ['equirectangular', 'labProjEquirect'],
            ] as const
          ).map(([id, key]) => (
            <button
              key={id}
              type="button"
              className={projId === id ? 'is-active' : ''}
              onClick={() => setProjection(id)}
            >
              {t(key)}
            </button>
          ))}
        </div>
      ) : null}
      <svg
        className={`flat-map ${drawMode ? 'is-drawing' : ''}`}
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        role="img"
        aria-label={t('labFlatMap')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        style={{ touchAction: 'none' }}
      >
        <rect width={size.w} height={size.h} className="flat-map-ocean" />
        {showGraticule ? (
          <path d={path(graticule) ?? undefined} className="flat-map-graticule" />
        ) : null}
        <g className="flat-map-countries">
          {countries.map((f) => {
            const id = normalizeId(f.id)
            const d = path(f) ?? undefined
            if (!d) return null
            const isNeighbor = neighborSet?.has(id)
            const stroke =
              hideBorders || coastOnly
                ? isNeighbor
                  ? 'rgba(7,24,32,0.45)'
                  : 'rgba(7,24,32,0.12)'
                : 'rgba(7,24,32,0.55)'
            const fill = coastOnly ? '#c9b896' : biomeFill(id)
            return (
              <path
                key={id || f.properties.name}
                d={d}
                fill={fill}
                stroke={stroke}
                strokeWidth={isNeighbor ? 1.1 : hideBorders || coastOnly ? 0.35 : 0.55}
                className="flat-country"
                data-hit-id={id}
              />
            )
          })}
        </g>
        {typeof children === 'function' ? children({ projection, path }) : children}
        {strokePreview && strokePreview.length > 1 ? (
          <polyline
            className="flat-map-stroke"
            fill="none"
            points={strokePreview.map((p) => p.join(',')).join(' ')}
          />
        ) : null}
      </svg>
      {interactivePanZoom && !drawMode ? (
        <div className="map-zoom-controls flat-map-zoom">
          <button type="button" className="map-zoom-btn" onClick={() => setZoom((z) => Math.min(6, z * 1.25))} aria-label={t('ariaZoomIn')}>
            +
          </button>
          <button type="button" className="map-zoom-btn" onClick={() => setZoom((z) => Math.max(0.4, z / 1.25))} aria-label={t('ariaZoomOut')}>
            −
          </button>
        </div>
      ) : null}
    </div>
  )
}
