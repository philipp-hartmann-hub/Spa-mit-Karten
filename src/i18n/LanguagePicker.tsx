import { LOCALES, type Locale } from './types'
import { useLocale } from './LocaleContext'

export function LanguagePicker({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useLocale()

  return (
    <div className={`lang-picker ${className}`.trim()} role="group" aria-label={t('langAria')}>
      {LOCALES.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`lang-option ${locale === opt.id ? 'is-active' : ''}`}
          aria-pressed={locale === opt.id}
          onClick={() => setLocale(opt.id as Locale)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
