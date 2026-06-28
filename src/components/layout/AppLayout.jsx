import { useState } from 'react'
import { AppHeader } from './AppHeader'
import { MobileMenuButton, Sidebar } from './Sidebar'

export function AppLayout({ children, bottomNav }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen bg-gradient-to-b from-white via-slate-50 to-civic-purple-light/20">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile: compact bar with menu; desktop: full AppHeader */}
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <MobileMenuButton onClick={() => setMobileOpen(true)} />
            <span className="text-sm font-semibold text-charcoal">Migrant Assistant</span>
            <div className="w-11" />
          </div>
        </div>

        <div className="hidden lg:block">
          <AppHeader />
        </div>

        <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {bottomNav}
      </div>
    </div>
  )
}
