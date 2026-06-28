import { Calendar, FileText, LayoutGrid, Map, User } from 'lucide-react'
import { useLocale } from '../../i18n/useLocale'

const tabs = [
  { id: 'timeline', icon: Calendar, labelKey: 'nav.timeline', requiresComplete: false, disabled: true },
  { id: 'map', icon: Map, labelKey: 'nav.map', requiresComplete: true },
  { id: 'help', icon: LayoutGrid, labelKey: 'nav.help', requiresComplete: false },
  { id: 'documents', icon: FileText, labelKey: 'nav.documents', requiresComplete: true },
  { id: 'profile', icon: User, labelKey: 'nav.profile', requiresComplete: false, disabled: true },
]

export function BottomNav({ active = 'help', helpComplete = false, onNavigate }) {
  const { t } = useLocale()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch justify-around">
        {tabs.map(({ id, icon: Icon, labelKey, requiresComplete, disabled }) => {
          const isActive = active === id
          const isDisabled = disabled || (requiresComplete && !helpComplete)

          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onNavigate?.(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple ${
                  isDisabled
                    ? 'cursor-not-allowed text-slate-300'
                    : isActive
                      ? 'text-civic-purple'
                      : 'text-slate-500 hover:text-charcoal'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
                {t(labelKey)}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
