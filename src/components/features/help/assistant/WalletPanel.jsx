import { Download, Trash2, Wallet } from 'lucide-react'
import { useLocale } from '../../../../i18n/useLocale'
import { downloadWalletItemAsPdf } from '../../../../utils/walletExport'
import { Button } from '../../../ui/Button'

export function WalletPanel({ items, onRemove, className = '' }) {
  const { t } = useLocale()

  if (!items?.length) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center ${className}`}
      >
        <Wallet className="mx-auto text-slate-300" size={28} aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-slate-500">{t('assistant.wallet.empty')}</p>
        <p className="mt-1 text-xs text-slate-400">{t('assistant.wallet.emptyHint')}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-charcoal">
          {t('assistant.wallet.title')} ({items.length})
        </p>
        <button
          type="button"
          onClick={() => items.forEach((item) => downloadWalletItemAsPdf(item))}
          className="text-xs font-medium text-civic-purple hover:underline"
        >
          {t('assistant.wallet.exportAll')}
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-civic-purple-light">
              <Wallet className="text-civic-purple" size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-charcoal">{item.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                {item.contextSummary?.userPrompt ?? item.userPrompt}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                {item.type === 'session'
                  ? t('assistant.wallet.typeSession', { count: item.cards?.length ?? 0 })
                  : t('assistant.wallet.typeCard')}
                {' · '}
                {new Date(item.savedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => downloadWalletItemAsPdf(item)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-civic-purple hover:bg-civic-purple-light"
                aria-label={t('assistant.wallet.download')}
              >
                <Download size={16} />
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                aria-label={t('assistant.wallet.remove')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WalletToolbar({
  walletCount,
  onSaveAll,
  onDownloadBundle,
  onToggleWallet,
  walletOpen,
  saving,
}) {
  const { t } = useLocale()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        onClick={onSaveAll}
        disabled={saving}
        className="text-xs sm:text-sm"
      >
        {t('assistant.wallet.saveAll')}
      </Button>
      <Button variant="ghost" onClick={onDownloadBundle} className="text-xs sm:text-sm">
        <Download size={16} className="mr-1.5" aria-hidden="true" />
        {t('assistant.wallet.downloadSession')}
      </Button>
      <button
        type="button"
        onClick={onToggleWallet}
        className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-charcoal hover:border-civic-purple hover:text-civic-purple sm:text-sm"
      >
        <Wallet size={16} aria-hidden="true" />
        {walletOpen ? t('assistant.wallet.hide') : t('assistant.wallet.show')}
        {walletCount > 0 && (
          <span className="rounded-full bg-civic-purple px-1.5 py-0.5 text-[10px] text-white">
            {walletCount}
          </span>
        )}
      </button>
    </div>
  )
}
