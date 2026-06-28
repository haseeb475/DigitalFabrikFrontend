import { Wallet } from 'lucide-react'
import { useLocale } from '../../../../i18n/useLocale'
import { Button } from '../../../ui/Button'
import { STATUS_STYLES } from './assistantUtils'
import { GuideAvatar } from './GuideAvatar'

/**
 * A holistic recap of the user's guide, shown below the action cards (not
 * pinned). It summarizes the whole situation — selected goal, the single most
 * important next step, every step at a glance, and urgency — without repeating
 * the personal clarifying questions. It can be saved to the wallet.
 *
 * @param {{
 *   summary: {
 *     empty: boolean,
 *     goalLabel: string|null,
 *     steps: Array<{ id: string, title: string, classification: string }>,
 *     verdict: { text: string, fromCardId: string|null },
 *     urgency: { level: 'none'|'soon'|'urgent', label: string, detail: string|null, colorToken: string },
 *   },
 *   onAddToWallet?: () => void,
 *   inWallet?: boolean,
 * }} props
 */
export function SummaryCard({ summary, onAddToWallet, inWallet = false }) {
  const { t } = useLocale()

  if (!summary) return null

  const { empty, goalLabel, steps = [], verdict, urgency } = summary
  const verdictText = verdict?.text || (empty ? t('summary.empty') : '')

  return (
    <section
      aria-label={t('summary.title')}
      className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${STATUS_STYLES.summary}`}
    >
      <h2 className="text-base font-semibold leading-snug text-charcoal">
        {t('summary.title')}
      </h2>

      {goalLabel && (
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-medium text-slate-500">{t('summary.goalLabel')}: </span>
          <span className="font-semibold text-charcoal">{goalLabel}</span>
        </p>
      )}

      {/* Verdict — the single most important next action, in Nav's voice */}
      {verdictText && (
        <div className="mt-3 flex items-start gap-3 rounded-xl bg-white/70 p-3 ring-1 ring-civic-purple/20">
          <GuideAvatar size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-civic-purple">
              {empty ? t('guide.name') : t('summary.verdictPrefix')}
            </p>
            <p className="mt-1 text-lg font-bold leading-snug text-charcoal">
              {verdictText}
            </p>
          </div>
        </div>
      )}

      {/* Whole-guide overview — every step at a glance */}
      {!empty && steps.length > 0 && (
        <ol className="mt-4 space-y-1.5">
          {steps.map((step, i) => (
            <li key={step.id} className="flex items-start gap-2 text-sm text-charcoal">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-civic-purple-light text-[11px] font-bold text-civic-purple">
                {i + 1}
              </span>
              <span className="pt-px">{step.title}</span>
            </li>
          ))}
        </ol>
      )}

      {!empty && urgency?.label && (
        <div aria-live="polite" className="mt-4 border-t border-civic-purple/20 pt-3">
          <p className={`text-sm font-semibold ${urgency.colorToken}`}>{urgency.label}</p>
          {urgency.detail && (
            <p className="mt-0.5 text-sm text-slate-600">{urgency.detail}</p>
          )}
        </div>
      )}

      {!empty && onAddToWallet && (
        <div className="mt-4 border-t border-civic-purple/20 pt-4">
          <Button
            variant={inWallet ? 'ghost' : 'secondary'}
            className="w-full"
            disabled={inWallet}
            onClick={onAddToWallet}
          >
            <Wallet size={16} className="mr-2" aria-hidden="true" />
            {inWallet ? t('assistant.wallet.inWallet') : t('assistant.wallet.addCard')}
          </Button>
        </div>
      )}
    </section>
  )
}
