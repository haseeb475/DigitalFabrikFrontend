import { Calendar, FileText, MapPin, Phone, Check, AlertTriangle } from 'lucide-react'
import { useLocale } from '../../i18n/useLocale'
import { useJourneyState } from '../../hooks/useJourneyState'
import { DOCUMENT_LABEL_KEYS } from '../../data/flows'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

const iconMap = {
  Calendar,
  FileText,
  MapPin,
  Phone,
}

export function ActionDeck() {
  const { t } = useLocale()
  const { actionData, actionLoading } = useJourneyState()

  if (actionLoading || !actionData) {
    return (
      <Card className="flex items-center justify-center py-16">
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      </Card>
    )
  }

  const { actions, checklist } = actionData

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="text-lg font-bold text-charcoal">{t('actions.title')}</h2>
        <p className="mt-1 text-sm text-slate-600">{t('actions.subtitle')}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = iconMap[action.icon] ?? FileText
            return (
              <button
                key={action.id}
                type="button"
                className="flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-colors hover:border-civic-purple hover:bg-civic-purple-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple"
              >
                <Icon className="text-civic-purple" size={24} aria-hidden="true" />
                <span className="text-xs font-semibold text-charcoal">{t(action.labelKey)}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-bold text-charcoal">{t('actions.checklistTitle')}</h3>
        <ul className="mt-4 space-y-3">
          {checklist.map((item) => (
            <li
              key={item.id}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 ${
                item.hasDocument ? 'bg-emerald-50' : 'bg-amber-50'
              }`}
            >
              {item.hasDocument ? (
                <Check className="shrink-0 text-gentle-emerald" size={20} aria-hidden="true" />
              ) : (
                <AlertTriangle
                  className="shrink-0 text-amber-gold"
                  size={20}
                  aria-hidden="true"
                />
              )}
              <span className="flex-1 text-sm font-medium text-charcoal">
                {t(DOCUMENT_LABEL_KEYS[item.id] ?? `intake.documents.${item.id}`)}
              </span>
              <span className="sr-only">
                {item.hasDocument ? t('actions.checklistHas') : t('actions.checklistMissing')}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="rounded-xl border border-civic-purple/20 bg-civic-purple-light p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-charcoal">{t('actions.counselorTitle')}</p>
            <p className="mt-1 text-sm text-slate-600">{t('actions.counselorDescription')}</p>
          </div>
          <Button className="shrink-0">{t('actions.counselorCta')}</Button>
        </div>
      </div>
    </div>
  )
}
