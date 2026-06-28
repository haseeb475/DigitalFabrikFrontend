import { useLocale } from '../../../../i18n/useLocale'
import { AssistantIcon } from './assistantUtils'

/**
 * A single tappable goal presented in the Navigator entry grid. Renders as a
 * native <button> so keyboard activation (Enter/Space), focus, and the
 * accessible name come for free. Clicking (or activating) calls
 * `onSelect(tile)`.
 *
 * @param {{
 *   tile: { id: string, intent?: string, icon: string, labelKey: string, descriptionKey: string, seedPrompt: string },
 *   onSelect: (tile: object) => void,
 *   disabled?: boolean,
 * }} props
 */
export function GoalTile({ tile, onSelect, disabled = false }) {
  const { t } = useLocale()
  const label = t(tile.labelKey)
  const description = t(tile.descriptionKey)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(tile)}
      aria-label={label}
      className="flex min-h-[44px] min-w-[44px] flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-civic-purple/40 hover:bg-civic-purple-light/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-civic-purple-light text-civic-purple">
        <AssistantIcon name={tile.icon} className="text-civic-purple" size={20} />
      </span>
      <span className="font-semibold leading-snug text-charcoal">{label}</span>
      <span className="text-sm leading-relaxed text-slate-500">{description}</span>
    </button>
  )
}
