import { useLocale } from '../../i18n/useLocale'
import { useJourneyState } from '../../hooks/useJourneyState'
import { NODE_LAYOUT } from '../../data/flows'
import { Card } from '../ui/Card'
import { MapNode } from './MapNode'

const positionClasses = {
  top: 'col-start-2 row-start-1 justify-self-center',
  left: 'col-start-1 row-start-2 justify-self-end',
  right: 'col-start-3 row-start-2 justify-self-start',
  bottom: 'col-start-2 row-start-3 justify-self-center',
}

export function TopicMap() {
  const { t } = useLocale()
  const { session, activeNodeId, selectNode } = useJourneyState()

  return (
    <Card className="flex flex-col">
      <h2 className="mb-6 text-lg font-bold text-charcoal">{t('map.hubTitle')}</h2>

      <div className="relative flex flex-1 items-center justify-center py-4">
        <div className="grid grid-cols-3 grid-rows-3 items-center gap-2">
          {/* Connection lines (decorative SVG) */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <line x1="50%" y1="30%" x2="50%" y2="50%" stroke="#E2E8F0" strokeWidth="2" />
            <line x1="30%" y1="50%" x2="50%" y2="50%" stroke="#E2E8F0" strokeWidth="2" />
            <line x1="70%" y1="50%" x2="50%" y2="50%" stroke="#E2E8F0" strokeWidth="2" />
            <line x1="50%" y1="70%" x2="50%" y2="50%" stroke="#E2E8F0" strokeWidth="2" />
          </svg>

          {/* Center hub */}
          <div className="col-start-2 row-start-2 flex justify-center">
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-civic-purple text-center shadow-md">
              <span className="px-2 text-xs font-bold leading-tight text-white">
                {t('map.hubTitle')}
              </span>
            </div>
          </div>

          {NODE_LAYOUT.map(({ id, position }) => {
            const node = session?.nodes?.[id]
            return (
              <MapNode
                key={id}
                nodeId={id}
                status={node?.status ?? 'locked'}
                isSelected={activeNodeId === id}
                onSelect={selectNode}
                className={`relative z-10 ${positionClasses[position]}`}
              />
            )
          })}
        </div>
      </div>
    </Card>
  )
}
