import { useState } from 'react'
import { GOAL_TILES } from '../../../../data/assistantMock'
import { useLocale } from '../../../../i18n/useLocale'
import { FollowUpInput } from './FollowUpInput'
import { GoalTileGrid } from './GoalTileGrid'
import { GuideMessage } from './GuideMessage'

/**
 * Pure validation helper for free-text navigator input. Returns true iff the
 * trimmed text length is between 1 and 1000 (inclusive). Empty,
 * whitespace-only, or over-length input is rejected.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function validateFreeText(text) {
  if (typeof text !== 'string') return false
  const trimmed = text.trim()
  return trimmed.length >= 1 && trimmed.length <= 1000
}

/**
 * Navigator entry view. Presents two co-equal paths to start a session: a grid
 * of predefined goal tiles and a free-text field. Neither path is visually
 * demoted relative to the other.
 *
 * @param {{
 *   onStart: (seed: { prompt: string, intent?: string }) => void,
 *   loading?: boolean,
 *   error?: string | null,
 * }} props
 */
export function NavigatorEntry({ onStart, loading = false, error }) {
  const { t } = useLocale()
  const [localError, setLocalError] = useState(null)

  const handleSelectTile = (tile) => {
    if (!tile.intent) {
      setLocalError(t('navigator.entry.tileError'))
      return
    }
    setLocalError(null)
    onStart?.({ prompt: tile.seedPrompt, intent: tile.intent })
  }

  const handleFreeTextSubmit = (text) => {
    if (!validateFreeText(text)) {
      setLocalError(t('navigator.entry.freeTextError'))
      return
    }
    setLocalError(null)
    onStart?.({ prompt: text.trim() })
  }

  const gridError = error ?? localError

  return (
    <div className="flex flex-col gap-6">
      <GuideMessage>{t('guide.greeting')}</GuideMessage>

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-charcoal">{t('navigator.entry.title')}</h2>
        <p className="text-sm leading-relaxed text-slate-500">
          {t('navigator.entry.subtitle')}
        </p>
      </div>

      <GoalTileGrid
        tiles={GOAL_TILES}
        onSelect={handleSelectTile}
        disabled={loading}
        errorMessage={gridError}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-charcoal">
          {t('landing.freeTextLabel')}
        </span>
        <FollowUpInput
          onSubmit={handleFreeTextSubmit}
          loading={loading}
          placeholderKey="landing.freeTextLabel"
        />
      </div>
    </div>
  )
}
