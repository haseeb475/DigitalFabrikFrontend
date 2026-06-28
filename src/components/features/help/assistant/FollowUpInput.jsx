import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useLocale } from '../../../../i18n/useLocale'

export function FollowUpInput({
  onSubmit,
  loading,
  labelKey = 'assistant.followUp.label',
  placeholderKey = 'assistant.followUp.placeholder',
  contextLabel = null,
  onClearContext,
}) {
  const { t } = useLocale()
  const inputId = useId()
  const formRef = useRef(null)
  const inputRef = useRef(null)
  const [value, setValue] = useState('')

  // When the user taps "Ask about this card", the shared input gets a context
  // label — gently bring it into view (respecting the sticky header / bottom
  // nav via scroll-margin) and focus it, without yanking the whole page.
  useEffect(() => {
    if (contextLabel && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      inputRef.current?.focus({ preventScroll: true })
    }
  }, [contextLabel])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || loading) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="scroll-mt-24 scroll-mb-28 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm"
    >
      <label htmlFor={inputId} className="mb-2 block text-xs font-medium text-slate-400">
        {t(labelKey)}
      </label>

      {contextLabel && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-civic-purple-light px-2.5 py-1 text-[11px] font-semibold text-civic-purple">
          <span>{contextLabel}</span>
          {onClearContext && (
            <button
              type="button"
              onClick={onClearContext}
              aria-label={t('assistant.followUp.clear')}
              className="rounded-full p-0.5 hover:bg-white/70"
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t(placeholderKey)}
          disabled={loading}
          className="min-h-10 flex-1 bg-transparent text-sm text-charcoal placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="shrink-0 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-charcoal transition-colors hover:bg-civic-purple-light hover:text-civic-purple disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            t('assistant.followUp.go')
          )}
        </button>
      </div>
    </form>
  )
}
