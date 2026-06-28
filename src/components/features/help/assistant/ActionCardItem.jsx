import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ChevronDown, ExternalLink, Lightbulb, MessageCirclePlus, Wallet } from 'lucide-react'
import { useLocale } from '../../../../i18n/useLocale'
import { Button } from '../../../ui/Button'
import {
  AssistantIcon,
  DETAIL_STATUS_COLOR,
  DETAIL_STATUS_ICON,
  STATUS_STYLES,
  classificationToStatus,
} from './assistantUtils'

function CardContent({ content }) {
  if (!content) return null

  return (
    <div className="space-y-4 border-t border-slate-100 pt-4">
      {content.body && (
        <p className="text-sm leading-relaxed text-slate-600">{content.body}</p>
      )}

      {content.steps?.length > 0 && (
        <ol className="space-y-2">
          {content.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-charcoal">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-civic-purple-light text-xs font-bold text-civic-purple">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      )}

      {content.items?.length > 0 && (
        <ul className="space-y-2">
          {content.items.map((item, i) => {
            const StatusIcon = DETAIL_STATUS_ICON[item.status] ?? DETAIL_STATUS_ICON.info
            const colorClass =
              DETAIL_STATUS_COLOR[item.status] ?? DETAIL_STATUS_COLOR.info

            return (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5"
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                >
                  <StatusIcon size={14} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-charcoal">{item.text}</span>
              </li>
            )
          })}
        </ul>
      )}

      {content.cta && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {content.cta.label}
        </Button>
      )}

      {content.sources?.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Sources
          </p>
          <ul className="mt-2 space-y-1.5">
            {content.sources.map((source, i) => (
              <li key={i}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-sm font-medium text-civic-purple hover:underline"
                >
                  {source.label}
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function ActionCardItem({
  card,
  expanded,
  onToggle,
  onAddToWallet,
  onAskAbout,
  inWallet,
  index,
}) {
  const { t } = useLocale()
  const status = classificationToStatus(card)
  const statusClass = STATUS_STYLES[status] ?? STATUS_STYLES.ready
  const hasContent = Boolean(card.content)

  const isActionable = card.classification === 'actionable'
  const ClassificationIcon = isActionable ? AlertCircle : Lightbulb
  const classificationLabel = isActionable
    ? t('classification.actionable')
    : t('classification.advisable')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`overflow-hidden rounded-2xl border shadow-sm transition-shadow ${
        expanded
          ? 'border-civic-purple bg-white ring-2 ring-civic-purple/20 shadow-md'
          : `${statusClass} hover:shadow-md`
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(card.id)}
        aria-expanded={expanded}
        className="flex w-full flex-col p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-civic-purple sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <AssistantIcon name={card.icon} className="text-civic-purple" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-snug text-charcoal">{card.title}</h3>
              {hasContent && (
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-slate-400 transition-transform ${
                    expanded ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-charcoal">
              <ClassificationIcon size={12} aria-hidden="true" />
              {classificationLabel}
            </span>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{card.description}</p>
            {card.status === 'recommended' && !expanded && (
              <span className="mt-2 inline-block rounded-full bg-civic-purple px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {t('assistant.cardStatus.recommended')}
              </span>
            )}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && hasContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 sm:px-5">
              <CardContent content={card.content} />
              {onAddToWallet && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <Button
                    variant={inWallet ? 'ghost' : 'secondary'}
                    className="w-full"
                    disabled={inWallet}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToWallet(card.id)
                    }}
                  >
                    <Wallet size={16} className="mr-2" aria-hidden="true" />
                    {inWallet
                      ? t('assistant.wallet.inWallet')
                      : t('assistant.wallet.addCard')}
                  </Button>
                </div>
              )}

              {onAskAbout && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAskAbout(card)
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-civic-purple/30 bg-civic-purple-light/40 px-3.5 py-2 text-sm font-semibold text-civic-purple transition-colors hover:bg-civic-purple-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple"
                  >
                    <MessageCirclePlus size={16} aria-hidden="true" />
                    {t('assistant.followUp.cardContext')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
