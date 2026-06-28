import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useLocale } from '../../../../i18n/useLocale'
import { PROMPT_SUGGESTIONS } from '../../../../data/assistantMock'
import { FollowUpInput } from './FollowUpInput'

export function AssistantEmptyState({ onSubmit, loading }) {
  const { t } = useLocale()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-8 text-center sm:py-12"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-civic-purple-light to-white shadow-sm ring-1 ring-civic-purple/10">
        <Sparkles className="text-civic-purple" size={28} aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-charcoal sm:text-2xl">
        {t('assistant.empty.title')}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        {t('assistant.empty.subtitle')}
      </p>

      <div className="mt-6 w-full max-w-xl">
        <FollowUpInput
          onSubmit={onSubmit}
          loading={loading}
          placeholderKey="assistant.empty.placeholder"
        />
      </div>

      <div className="mt-8 w-full max-w-xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('assistant.empty.suggestions')}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {PROMPT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => onSubmit(suggestion.label)}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-civic-purple hover:bg-civic-purple-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple disabled:opacity-50"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function AssistantLoadingCards() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
        />
      ))}
    </div>
  )
}
