import { AppLogo } from '../ui/AppLogo'
import { LanguageSelector } from '../ui/LanguageToggle'
import { useLocale } from '../../i18n/useLocale'

export function AppHeader({ className = '' }) {
  const { t } = useLocale()

  return (
    <header
      className={`sticky top-0 z-30 w-full border-b border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <AppLogo size={40} />
          <span className="text-base font-semibold text-charcoal">{t('brand.title')}</span>
        </div>
        <LanguageSelector />
      </div>
    </header>
  )
}
