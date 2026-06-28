import { FileText, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { useLocale } from '../../i18n/useLocale'
import { Badge } from '../ui/Badge'

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard' },
  { id: 'documents', icon: FileText, labelKey: 'sidebar.documents' },
  { id: 'settings', icon: Settings, labelKey: 'sidebar.settings' },
]

export function Sidebar({ mobileOpen, onMobileClose }) {
  const { t } = useLocale()
  const [collapsed, setCollapsed] = useState(false)

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        {!collapsed && (
          <span className="text-sm font-bold text-civic-purple">{t('brand.title')}</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple lg:flex"
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
        <button
          type="button"
          onClick={onMobileClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple lg:hidden"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {navItems.map(({ id, icon: Icon, labelKey }) => (
          <button
            key={id}
            type="button"
            className={`flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple ${
              id === 'dashboard'
                ? 'bg-civic-purple-light text-civic-purple'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            aria-current={id === 'dashboard' ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            {!collapsed && <span>{t(labelKey)}</span>}
          </button>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <Badge variant="guest" className="w-full justify-center py-2">
          <span className="h-2 w-2 rounded-full bg-gentle-emerald" aria-hidden="true" />
          {!collapsed && <span>{t('sidebar.guestBadge')}</span>}
        </Badge>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-slate-100 bg-white transition-all lg:flex ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }) {
  const { t } = useLocale()

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple lg:hidden"
      aria-label={t('sidebar.openMenu')}
    >
      <Menu size={22} />
    </button>
  )
}
