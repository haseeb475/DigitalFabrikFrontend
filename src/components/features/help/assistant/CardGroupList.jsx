import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { orderActionCards } from '../../../../data/assistantMock'
import { useLocale } from '../../../../i18n/useLocale'
import { ActionCardGrid } from './ActionCardGrid'

/**
 * A single card group rendered as a visually bounded block. The current
 * (latest) result is shown plainly; earlier results are rendered `muted` so the
 * current answer stays visually dominant.
 */
function CardGroup({ group, onAddToWallet, isCardInWallet, onAskAbout, muted = false }) {
  return (
    <section
      className={`rounded-2xl border p-4 shadow-sm ${
        muted ? 'border-slate-200 bg-slate-50/60' : 'border-slate-200 bg-white'
      }`}
    >
      {group.prompt && (
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
          {group.prompt}
        </p>
      )}
      {group.intro && (
        <p className="mb-3 text-sm font-medium text-slate-700">{group.intro}</p>
      )}
      <ActionCardGrid
        cards={orderActionCards(group.cards)}
        onAddToWallet={onAddToWallet}
        isCardInWallet={isCardInWallet}
        onAskAbout={onAskAbout}
      />
    </section>
  )
}

/**
 * Hybrid history view: the latest card group is shown prominently as the
 * current result, while any earlier groups are tucked into a collapsible
 * "earlier results" accordion (kept for context, not removed). Groups arrive
 * sorted ascending by createdAt, so the last entry is the most recent.
 */
export function CardGroupList({ cardGroups, onAddToWallet, isCardInWallet, onAskAbout }) {
  const { t } = useLocale()
  const [showEarlier, setShowEarlier] = useState(false)

  if (!cardGroups?.length) return null

  const latest = cardGroups[cardGroups.length - 1]
  const earlier = cardGroups.slice(0, -1)

  return (
    <div className="flex flex-col gap-4">
      {/* Current result — always visible and prominent */}
      <CardGroup
        group={latest}
        onAddToWallet={onAddToWallet}
        isCardInWallet={isCardInWallet}
        onAskAbout={onAskAbout}
      />

      {/* Earlier results — collapsed by default, kept for context */}
      {earlier.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowEarlier((v) => !v)}
            aria-expanded={showEarlier}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:border-civic-purple hover:text-civic-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple"
          >
            <span>{t('navigator.earlierResults', { count: earlier.length })}</span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-slate-400 transition-transform ${
                showEarlier ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {showEarlier && (
            <div className="flex flex-col gap-4">
              {earlier.map((group) => (
                <CardGroup
                  key={group.id}
                  group={group}
                  onAddToWallet={onAddToWallet}
                  isCardInWallet={isCardInWallet}
                  onAskAbout={onAskAbout}
                  muted
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
