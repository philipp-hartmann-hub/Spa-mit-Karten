import { LanguagePicker, useLocale } from './i18n'

type Props = {
  onSingle: () => void
  onMulti: () => void
  joinCode: string | null
  onJoinWithCode: (code: string) => void
}

export function HomeScreen({ onSingle, onMulti, joinCode, onJoinWithCode }: Props) {
  const { t } = useLocale()

  return (
    <div className="home">
      <div className="atmosphere" aria-hidden />
      <LanguagePicker className="lang-picker-intro" />
      <header className="home-hero">
        <p className="version">{t('version')}</p>
        <h1 className="brand">{t('brand')}</h1>
        <p className="home-lead">{t('homeLead')}</p>
      </header>

      <div className="home-actions">
        <button type="button" className="home-card" onClick={onSingle}>
          <span className="home-card-title">{t('homeSingle')}</span>
          <span className="home-card-hint">{t('homeSingleHint')}</span>
        </button>
        <button type="button" className="home-card" onClick={onMulti}>
          <span className="home-card-title">{t('homeMulti')}</span>
          <span className="home-card-hint">{t('homeMultiHint')}</span>
        </button>
      </div>

      {joinCode ? (
        <div className="home-join-banner">
          <p>{t('homeJoinDetected', { code: joinCode })}</p>
          <button type="button" className="cta" onClick={() => onJoinWithCode(joinCode)}>
            {t('homeJoinRoom')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
