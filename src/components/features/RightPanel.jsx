import { MapPin } from 'lucide-react'
import { useLocale } from '../../i18n/useLocale'
import { useJourneyState } from '../../hooks/useJourneyState'
import { Card } from '../ui/Card'
import { ActionDeck } from './ActionDeck'
import { IntakeDeck } from './IntakeDeck'

export function RightPanel() {
  const { t } = useLocale()
  const { viewMode, loading } = useJourneyState()

  if (loading && viewMode === 'empty') {
    return (
      <Card className="flex items-center justify-center py-16">
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      </Card>
    )
  }

  if (viewMode === 'empty') {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <MapPin className="text-slate-400" size={28} aria-hidden="true" />
        </div>
        <p className="max-w-xs text-sm font-medium text-slate-500">{t('map.selectPrompt')}</p>
      </Card>
    )
  }

  if (viewMode === 'actions') {
    return <ActionDeck />
  }

  return <IntakeDeck />
}
