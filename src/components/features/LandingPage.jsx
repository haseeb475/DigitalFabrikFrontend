import { Lock, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../../i18n/useLocale'
import { useGuestSession } from '../../hooks/useGuestSession'
import { AppHeader } from '../layout/AppHeader'
import { Button } from '../ui/Button'
import { LandingIllustration } from '../ui/LandingIllustration'
import { ModeCard } from '../ui/ModeCard'

export function LandingPage() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { initialize } = useGuestSession()

  const handleGuestContinue = async () => {
    const ok = await initialize({ restartHelp: true })
    if (ok) navigate('/dashboard')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-slate-50 to-civic-purple-light/30">
      {/* Soft background accents */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-civic-purple/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl"
        aria-hidden="true"
      />

      <AppHeader />

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-2 sm:px-6 lg:pb-24">
        {/* Hero */}
        <section className="mx-auto max-w-2xl text-center">
          <LandingIllustration className="mx-auto w-full max-w-md" />
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            {t('landing.heroTitle')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-500 sm:text-lg">
            {t('landing.heroSubtitle')}
          </p>
        </section>

        {/* Mode selection */}
        <section className="mt-12 grid gap-5 lg:mt-14 lg:grid-cols-2 lg:gap-6" aria-label={t('landing.sectionLabel')}>
          <ModeCard
            icon={Sparkles}
            title={t('landing.personalized.title')}
            description={t('landing.personalized.description')}
            features={[
              t('landing.personalized.bullet1'),
              t('landing.personalized.bullet2'),
              t('landing.personalized.bullet3'),
              t('landing.personalized.bullet4'),
            ]}
            badge={t('landing.personalized.comingSoon')}
            muted
            action={
              <Button variant="ghost" disabled className="w-full">
                {t('landing.personalized.cta')}
              </Button>
            }
          />

          <ModeCard
            icon={UserRound}
            title={t('landing.guest.title')}
            description={t('landing.guest.description')}
            features={[
              t('landing.guest.bullet1'),
              t('landing.guest.bullet2'),
              t('landing.guest.bullet3'),
              t('landing.guest.bullet4'),
            ]}
            highlighted
            action={
              <Button onClick={handleGuestContinue} className="w-full py-3 text-base">
                {t('landing.guest.cta')}
              </Button>
            }
          />
        </section>

        {/* Trust strip */}
        <section className="mt-10 rounded-2xl border border-slate-200/60 bg-white/70 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck size={20} className="text-gentle-emerald" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm font-medium text-charcoal">{t('landing.trust.title')}</p>
              <p className="text-sm leading-relaxed text-slate-500">{t('landing.trust.body')}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Lock size={13} aria-hidden="true" />
                  {t('landing.trust.point1')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock size={13} aria-hidden="true" />
                  {t('landing.trust.point2')}
                </span>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-slate-400">
          {t('landing.loginPrompt')}{' '}
          <button
            type="button"
            disabled
            className="font-medium text-civic-purple disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('landing.loginLink')}
          </button>
        </p>
      </main>
    </div>
  )
}
