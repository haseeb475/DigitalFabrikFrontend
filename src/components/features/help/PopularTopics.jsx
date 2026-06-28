import { ChevronRight } from 'lucide-react'
import { useLocale } from '../../../i18n/useLocale'
import { useGuidedInterview } from '../../../hooks/useGuidedInterview'
import { POPULAR_TOPICS } from '../../../data/auslanderInterview'
import { apiService } from '../../../services/mockApi'

export function PopularTopics({ onSelectTopic }) {
  const { t } = useLocale()
  const { goToChooseMode, finishAndExplore, session, refresh } = useGuidedInterview()

  const handleTopic = async (topic) => {
    if (session?.helpFlow?.phase !== 'complete') {
      await finishAndExplore()
    }
    await apiService.saveActiveNode(topic.nodeId)
    await refresh()
    onSelectTopic?.('map')
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <button
        type="button"
        onClick={goToChooseMode}
        className="mb-6 text-sm font-medium text-civic-purple hover:underline"
      >
        ← {t('help.backToChoose')}
      </button>

      <h1 className="text-xl font-bold text-charcoal">{t('help.topics.title')}</h1>
      <p className="mt-2 text-sm text-slate-500">{t('help.topics.subtitle')}</p>

      <ul className="mt-6 space-y-2">
        {POPULAR_TOPICS.map((topic) => (
          <li key={topic.id}>
            <button
              type="button"
              onClick={() => handleTopic(topic)}
              className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-charcoal transition-colors hover:border-civic-purple hover:bg-civic-purple-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple"
            >
              {t(topic.labelKey)}
              <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
