import type { ReactNode } from 'react'
import { useLocale } from '../i18n'

type Props = {
  points: number
  explanation: string
  onNext: () => void
  extra?: ReactNode
  nextLabelKey?: 'nextRound' | 'labAgain'
}

export function RoundResult({
  points,
  explanation,
  onNext,
  extra,
  nextLabelKey = 'nextRound',
}: Props) {
  const { t } = useLocale()
  return (
    <div className="lab-round-result" role="status">
      <p className="lab-round-points">
        {t('points')}: <strong>+{Math.round(points)}</strong>
      </p>
      <p className="lab-round-explain">{explanation}</p>
      {extra}
      <button type="button" className="cta" onClick={onNext}>
        {t(nextLabelKey)}
      </button>
    </div>
  )
}
