import { useLocale } from '../i18n'

export function PopulationAttribution({ className = '' }: { className?: string }) {
  const { t } = useLocale()
  return <p className={`lab-pop-attr ${className}`}>{t('labPopAttribution')}</p>
}
