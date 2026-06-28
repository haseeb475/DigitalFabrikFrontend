import { MessageCircle, Search } from 'lucide-react'
import { useLocale } from '../../../i18n/useLocale'
import { useGuidedInterview } from '../../../hooks/useGuidedInterview'
import { Button } from '../../ui/Button'

export function ChooseHelpMode() {
  const { t } = useLocale()
  const { startInterview, showAssistant, loading } = useGuidedInterview()

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="text-center text-xl font-bold text-charcoal sm:text-2xl">
        {t('help.choose.title')}
      </h1>
      <p className="mt-2 text-center text-sm text-slate-500">{t('help.choose.subtitle')}</p>

      <div className="mt-8 space-y-4">
        {/* Guided Interview card */}
        <article className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-sm">
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-civic-purple-light">
                <MessageCircle className="text-civic-purple" size={24} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-charcoal">{t('help.guided.title')}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {t('help.guided.description')}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={startInterview}
              disabled={loading}
              className="mt-5 w-full py-3"
            >
              {t('help.guided.cta')}
            </Button>
          </div>
        </article>

        {/* Action workspace — free-form prompting with structured action cards */}
        <article className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-sm">
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-civic-purple-light">
                <Search className="text-civic-purple" size={24} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-charcoal">{t('help.browse.title')}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {t('help.browse.description')}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={showAssistant}
              disabled={loading}
              className="mt-5 w-full py-3"
            >
              {t('help.browse.cta')}
            </Button>
          </div>
        </article>
      </div>

      <button
        type="button"
        onClick={showAssistant}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm text-slate-600 backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple"
      >
        <span aria-hidden="true">💡</span>
        {t('help.choose.tip')}
      </button>
    </div>
  )
}
