import { useLocale } from '../../../../i18n/useLocale'

export function ContextSummary({ contextSummary }) {
  const { t } = useLocale()

  if (!contextSummary) return null

  const { answeredQuestions = [], followUpPrompts = [] } = contextSummary
  const hasAnswers = answeredQuestions.length > 0
  const hasFollowUps = followUpPrompts.length > 0

  if (!hasAnswers && !hasFollowUps) return null

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t('assistant.context.label')}
      </p>

      {hasAnswers && (
        <dl className="mt-2 space-y-2">
          {answeredQuestions.map((entry) => (
            <div key={entry.questionId}>
              <dt className="text-xs text-slate-500">{entry.question}</dt>
              <dd className="text-sm font-medium text-charcoal">{entry.answerLabel}</dd>
            </div>
          ))}
        </dl>
      )}

      {hasFollowUps && (
        <div className={hasAnswers ? 'mt-3 border-t border-slate-200/60 pt-3' : 'mt-2'}>
          <p className="text-xs text-slate-500">{t('assistant.context.followUps')}</p>
          <ul className="mt-1 space-y-0.5">
            {followUpPrompts.map((text, i) => (
              <li key={i} className="text-sm text-charcoal">
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
