import { type CSSProperties } from 'react'
import { LanguagePicker, useLocale } from './i18n'
import { WorldMap } from './WorldMap'

type Props = {
  onSingle: () => void
  onMulti: () => void
  joinCode: string | null
  onJoinWithCode: (code: string) => void
}

const HOME_CHOICES = [
  { id: 'single' as const, angle: -90 },
  { id: 'multi' as const, angle: 90 },
]

export function HomeScreen({ onSingle, onMulti, joinCode, onJoinWithCode }: Props) {
  const { t } = useLocale()

  return (
    <div className="app app-intro home-app">
      <div className="atmosphere" aria-hidden />
      <LanguagePicker className="lang-picker-intro" />

      <header className="intro intro-orbit home-hero-header">
        <p className="version">{t('version')}</p>
        <h1 className="brand">{t('brand')}</h1>
        <p className="home-lead">{t('homeLead')}</p>
      </header>

      <main className="stage stage-intro stage-orbit home-stage">
        <div className="globe-frame globe-frame-orbit">
          <div className="mode-orbit" role="navigation" aria-label={t('homeLead')}>
            {HOME_CHOICES.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="mode-orbit-item"
                style={{ '--orbit-angle': `${opt.angle}deg` } as CSSProperties}
                onClick={opt.id === 'single' ? onSingle : onMulti}
              >
                <span className="mode-orbit-disc home-orbit-disc">
                  {opt.id === 'single' ? '1' : '∞'}
                </span>
                <span className="mode-orbit-label">
                  {opt.id === 'single' ? t('homeSingle') : t('homeMulti')}
                </span>
              </button>
            ))}
          </div>

          <WorldMap
            targetId={null}
            feedback="idle"
            wrongId={null}
            onSelect={() => {}}
            interactive={false}
            autoRotate
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
          />
        </div>
      </main>

      {joinCode ? (
        <div className="home-join-banner home-join-banner-float">
          <p>{t('homeJoinDetected', { code: joinCode })}</p>
          <button type="button" className="cta" onClick={() => onJoinWithCode(joinCode)}>
            {t('homeJoinRoom')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
