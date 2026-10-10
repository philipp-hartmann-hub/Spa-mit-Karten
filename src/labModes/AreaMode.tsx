import { useMemo, useState } from 'react'
import type { CountryFeature } from '../WorldMap'
import { countryLabel, normalizeId } from '../WorldMap'
import { useLocale } from '../i18n'
import { FlatMap } from './FlatMap'
import { RoundResult } from './RoundResult'
import { scoreAreaGuess } from './areaLogic'

type Props = {
  countries: CountryFeature[]
  onScored: (points: number) => void
}

function pick(countries: CountryFeature[]): CountryFeature {
  return countries[Math.floor(Math.random() * countries.length)]!
}

export function AreaMode({ countries, onScored }: Props) {
  const { locale, t } = useLocale()
  const [target, setTarget] = useState(() => pick(countries))
  const [guess, setGuess] = useState(300_000)
  const [result, setResult] = useState<{ points: number; truth: number } | null>(null)

  const fitIds = useMemo(() => [normalizeId(target.id)], [target])

  const submit = () => {
    const { truth, points } = scoreAreaGuess(guess, target)
    setResult({ points, truth })
    onScored(points)
  }

  const next = () => {
    setTarget(pick(countries))
    setGuess(300_000)
    setResult(null)
  }

  return (
    <div className="lab-mode">
      <p className="lab-prompt">{t('labAreaPrompt', { country: countryLabel(target, locale) })}</p>
      <FlatMap countries={countries} lockedProjection="equalEarth" fitIds={fitIds} showProjectionPicker={false} />
      {!result ? (
        <div className="lab-controls">
          <label>
            {t('labAreaGuess')}
            <input
              type="range"
              min={1}
              max={6}
              step={0.01}
              value={Math.log10(guess)}
              onChange={(e) => setGuess(10 ** Number(e.target.value))}
            />
            <span>{Math.round(guess).toLocaleString(locale)} km²</span>
          </label>
          <button type="button" className="cta" onClick={submit}>
            {t('labSubmit')}
          </button>
        </div>
      ) : (
        <RoundResult
          points={result.points}
          explanation={t('labAreaResult', {
            truth: Math.round(result.truth).toLocaleString(locale),
            guess: Math.round(guess).toLocaleString(locale),
          })}
          onNext={next}
        />
      )}
    </div>
  )
}
