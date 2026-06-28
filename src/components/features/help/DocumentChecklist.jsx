import { AlertTriangle, Check, FileText } from 'lucide-react'
import { useLocale } from '../../../i18n/useLocale'
import { useGuidedInterview } from '../../../hooks/useGuidedInterview'
import { DOCUMENT_LABEL_KEYS } from '../../../data/documentRules'
import { Button } from '../../ui/Button'

export function DocumentChecklist({ items = [], showCta = true, onContinue }) {
  const { t } = useLocale()
  const { finishAndExplore, loading } = useGuidedInterview()

  const ready = items.filter((d) => d.hasDocument)
  const missing = items.filter((d) => !d.hasDocument)

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <FileText className="text-civic-purple" size={24} aria-hidden="true" />
        <h1 className="text-lg font-bold text-charcoal">{t('help.results.title')}</h1>
      </div>

      {missing.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-charcoal">{t('help.results.stillNeeded')}</h2>
          <ul className="space-y-2">
            {missing.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <AlertTriangle size={18} className="shrink-0 text-amber-gold" aria-hidden="true" />
                <span className="text-sm font-medium">{t(DOCUMENT_LABEL_KEYS[item.id])}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ready.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-charcoal">{t('help.results.alreadyHave')}</h2>
          <ul className="space-y-2">
            {ready.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              >
                <Check size={18} className="shrink-0 text-gentle-emerald" aria-hidden="true" />
                <span className="text-sm font-medium">{t(DOCUMENT_LABEL_KEYS[item.id])}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showCta && (
        <Button
          onClick={onContinue ?? finishAndExplore}
          disabled={loading}
          className="mt-8 w-full py-3"
        >
          {loading ? t('common.loading') : t('help.results.cta')}
        </Button>
      )}
    </div>
  )
}
