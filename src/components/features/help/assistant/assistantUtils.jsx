import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  Clock,
  Coins,
  Compass,
  ExternalLink,
  FileText,
  Info,
  ListChecks,
  Search,
  Sparkles,
} from 'lucide-react'

export const ASSISTANT_ICON_MAP = {
  Search,
  FileText,
  ListChecks,
  Calendar,
  Coins,
  ExternalLink,
  AlertCircle,
  Clock,
  Info,
  Briefcase,
  Compass,
  Sparkles,
}

export function AssistantIcon({ name, className = '', size = 20 }) {
  const Icon = ASSISTANT_ICON_MAP[name] ?? Sparkles
  return <Icon className={className} size={size} aria-hidden="true" />
}

/**
 * Maps a card's classification to a STATUS_STYLES key.
 * Pure function — no side effects.
 *
 * - 'advisable'  -> 'recommended'
 * - 'actionable' + lacking info -> 'needs-info'
 * - 'actionable' + sufficient info -> 'ready'
 * - missing classification -> card.status (fallback to 'ready')
 *
 * A card "lacks info" when its status is 'needs-info' or 'needs_more_info'.
 */
export function classificationToStatus(card) {
  if (!card) return 'ready'

  const { classification, status } = card

  if (classification === 'advisable') {
    return 'recommended'
  }

  if (classification === 'actionable') {
    const lackingInfo = status === 'needs-info' || status === 'needs_more_info'
    return lackingInfo ? 'needs-info' : 'ready'
  }

  return status ?? 'ready'
}

export const STATUS_STYLES = {
  ready: 'border-slate-200 bg-white',
  recommended: 'border-civic-purple/40 bg-civic-purple-light/50 ring-1 ring-civic-purple/20',
  'needs-info': 'border-amber-200 bg-amber-50/80',
  completed: 'border-emerald-200 bg-emerald-50/60',
  summary: 'border-civic-purple bg-civic-purple-light/60 ring-1 ring-civic-purple/30',
}

export const DETAIL_STATUS_ICON = {
  ready: Check,
  info: Info,
  warning: AlertCircle,
}

export const DETAIL_STATUS_COLOR = {
  ready: 'text-gentle-emerald bg-emerald-50',
  info: 'text-civic-purple bg-civic-purple-light',
  warning: 'text-amber-gold bg-amber-50',
}
