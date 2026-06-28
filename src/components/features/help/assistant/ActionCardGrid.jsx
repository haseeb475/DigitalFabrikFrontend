import { useState } from 'react'
import { ActionCardItem } from './ActionCardItem'

export function ActionCardGrid({ cards, onAddToWallet, isCardInWallet, onAskAbout }) {
  const [expandedId, setExpandedId] = useState(null)

  if (!cards?.length) return null

  const handleToggle = (cardId) => {
    setExpandedId((prev) => (prev === cardId ? null : cardId))
  }

  return (
    <div className="flex flex-col gap-3">
      {cards.map((card, index) => (
        <ActionCardItem
          key={card.id}
          card={card}
          expanded={expandedId === card.id}
          onToggle={handleToggle}
          onAddToWallet={onAddToWallet}
          onAskAbout={onAskAbout}
          inWallet={isCardInWallet?.(card.id)}
          index={index}
        />
      ))}
    </div>
  )
}
