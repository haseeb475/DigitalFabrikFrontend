import { FileText, MessageSquare, ShieldCheck, Trash2, Wallet, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AUSLANDER_STEPS } from '../../../data/auslanderInterview'
import { useLocale } from '../../../i18n/useLocale'
import { apiService } from '../../../services/mockApi'

// Resolve the stored guided-interview answers into human-readable
// { question, value } rows using the question catalog + locale.
function resolveProfileRows(helpAnswers, t) {
  const rows = []
  for (const step of AUSLANDER_STEPS) {
    const key = step.answerKey
    if (!key || helpAnswers[key] === undefined || helpAnswers[key] === null) continue

    const raw = helpAnswers[key]
    const labelFor = (value) => {
      const opt = step.options?.find((o) => o.value === value)
      return opt ? t(opt.labelKey) : String(value)
    }
    const value = Array.isArray(raw)
      ? raw.map(labelFor).join(', ')
      : labelFor(raw)

    if (value) rows.push({ question: t(step.questionKey), value })
  }
  return rows
}

function Section({ icon: Icon, title, onClear, clearLabel, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-charcoal">
          <Icon size={16} className="text-civic-purple" aria-hidden="true" />
          {title}
        </h3>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-slate-400 hover:text-red-500"
          >
            {clearLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

/**
 * A read-only "Your information" review panel (overlay). It surfaces everything
 * the app has stored about the guest on this device — profile answers, explored
 * topics, and saved guides — grouped by source, with per-item Remove and a
 * Clear-everything control. All reads/writes go through the mock API, keeping
 * the localStorage boundary intact and reinforcing the privacy promise.
 */
export function MyInfoPanel({ open, onClose, onChanged }) {
  const { t } = useLocale()
  const [data, setData] = useState(null)

  const load = useCallback(async () => {
    const profile = await apiService.getStoredProfile()
    setData(profile)
  }, [])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  if (!open) return null

  const afterMutation = async () => {
    await load()
    await onChanged?.()
  }

  const handleClearProfile = async () => {
    await apiService.clearProfileAnswers()
    await afterMutation()
  }
  const handleRemoveTopic = async (id) => {
    await apiService.removeAssistantSession(id)
    await afterMutation()
  }
  const handleRemoveWallet = async (id) => {
    await apiService.removeFromWallet(id)
    await afterMutation()
  }
  const handleClearAll = async () => {
    await apiService.clearAllData()
    await afterMutation()
  }

  const profileRows = data ? resolveProfileRows(data.helpAnswers, t) : []

  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={t('myInfo.title')}>
      <button
        type="button"
        aria-label={t('myInfo.close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      <div className="relative flex h-full w-full max-w-md flex-col bg-slate-50 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck size={18} className="text-gentle-emerald" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-charcoal">{t('myInfo.title')}</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {t('myInfo.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('myInfo.close')}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-charcoal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Profile */}
          <Section
            icon={FileText}
            title={t('myInfo.profile')}
            clearLabel={t('myInfo.clearSection')}
            onClear={profileRows.length ? handleClearProfile : undefined}
          >
            {profileRows.length === 0 ? (
              <p className="text-sm text-slate-400">{t('myInfo.emptyProfile')}</p>
            ) : (
              <dl className="space-y-2">
                {profileRows.map((row, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <dt className="text-xs font-medium text-slate-500">{row.question}</dt>
                    <dd className="text-sm font-semibold text-charcoal">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Section>

          {/* Topics */}
          <Section icon={MessageSquare} title={t('myInfo.topics')}>
            {!data?.topics?.length ? (
              <p className="text-sm text-slate-400">{t('myInfo.emptyTopics')}</p>
            ) : (
              <ul className="space-y-2">
                {data.topics.map((topic) => (
                  <li
                    key={topic.id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-charcoal">{topic.title}</p>
                      {topic.answeredQuestions?.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {topic.answeredQuestions.map((a, i) => (
                            <li key={i} className="text-xs text-slate-500">
                              {a.question}: <span className="text-slate-700">{a.answerLabel}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic.id)}
                      aria-label={t('myInfo.remove')}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Saved guides (wallet) */}
          <Section icon={Wallet} title={t('myInfo.wallet')}>
            {!data?.wallet?.length ? (
              <p className="text-sm text-slate-400">{t('myInfo.emptyWallet')}</p>
            ) : (
              <ul className="space-y-2">
                {data.wallet.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-charcoal">{item.title}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {item.savedAt ? new Date(item.savedAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWallet(item.id)}
                      aria-label={t('myInfo.remove')}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Preferences */}
          <Section icon={ShieldCheck} title={t('myInfo.preferences')}>
            <p className="text-sm text-charcoal">
              <span className="text-slate-500">{t('myInfo.language')}: </span>
              <span className="font-semibold uppercase">{data?.locale ?? 'de'}</span>
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white p-4 sm:px-5">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <Trash2 size={16} aria-hidden="true" />
            {t('myInfo.clearAll')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
