import { motion } from 'framer-motion'
import { CornerDownRight } from 'lucide-react'
import { useLocale } from '../../../../i18n/useLocale'

export function SessionHeader({ originalPrompt, followUpPrompts = [] }) {
  const { t } = useLocale()

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm sm:p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t('assistant.session.label')}
      </p>
      <h2 className="mt-1 text-base font-semibold leading-snug text-charcoal sm:text-lg">
        {originalPrompt}
      </h2>

      {followUpPrompts.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {followUpPrompts.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2 text-sm text-slate-600"
            >
              <CornerDownRight
                size={14}
                className="mt-0.5 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
