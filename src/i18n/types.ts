export type Locale = 'de' | 'en' | 'fr'

export const LOCALES: { id: Locale; label: string }[] = [
  { id: 'de', label: 'DE' },
  { id: 'en', label: 'EN' },
  { id: 'fr', label: 'FR' },
]

export const LOCALE_STORAGE_KEY = 'smk-locale'

export function isLocale(value: string): value is Locale {
  return value === 'de' || value === 'en' || value === 'fr'
}
