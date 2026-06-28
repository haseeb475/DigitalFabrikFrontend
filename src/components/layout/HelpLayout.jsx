import { AppHeader } from './AppHeader'

export function HelpLayout({ children, bottomNav }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-slate-50 to-civic-purple-light/30">
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-civic-purple/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl"
        aria-hidden="true"
      />

      <AppHeader />

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-28 pt-2 sm:px-6 lg:pb-16">
        {children}
      </main>

      {bottomNav}
    </div>
  )
}
