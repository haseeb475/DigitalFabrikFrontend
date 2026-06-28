import { Check, Lock } from 'lucide-react'
import { useLocale } from '../../i18n/useLocale'

const statusStyles = {
  completed: {
    ring: 'ring-gentle-emerald',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    dot: 'bg-gentle-emerald',
  },
  active: {
    ring: 'ring-amber-gold',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-gold animate-pulse motion-reduce:animate-none',
  },
  locked: {
    ring: 'ring-slate-200',
    bg: 'bg-slate-50',
    text: 'text-slate-400',
    dot: 'bg-slate-300',
  },
}

export function MapNode({ nodeId, status, isSelected, onSelect, className = '' }) {
  const { t } = useLocale()
  const styles = statusStyles[status] ?? statusStyles.locked
  const isLocked = status === 'locked'
  const label = t(`map.nodes.${nodeId}`)
  const statusLabel = t(`map.status.${status}`)

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={() => onSelect(nodeId)}
      aria-label={`${label} — ${statusLabel}`}
      aria-current={isSelected ? 'true' : undefined}
      className={`group flex min-h-11 flex-col items-center gap-1 rounded-xl px-3 py-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple focus-visible:ring-offset-2 ${
        isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'
      } ${className}`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ring-2 ${styles.ring} ${styles.bg} ${
          isSelected ? 'ring-4 ring-civic-purple' : ''
        }`}
      >
        {status === 'completed' && (
          <Check className="text-gentle-emerald" size={24} aria-hidden="true" />
        )}
        {status === 'locked' && (
          <Lock className="text-slate-400" size={20} aria-hidden="true" />
        )}
        {status === 'active' && (
          <span className={`h-3 w-3 rounded-full ${styles.dot}`} aria-hidden="true" />
        )}
      </div>
      <span className={`max-w-[120px] text-xs font-semibold leading-tight ${styles.text}`}>
        {label}
      </span>
      <span className="sr-only">{statusLabel}</span>
    </button>
  )
}
