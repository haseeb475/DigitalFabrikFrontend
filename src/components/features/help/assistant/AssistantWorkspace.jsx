import { AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useLocale } from '../../../../i18n/useLocale'
import { useGuidedInterview } from '../../../../hooks/useGuidedInterview'
import {
  AssistantProvider,
  useAssistantSession,
} from '../../../../hooks/useAssistantSession'
import { downloadWalletBundleAsPdf } from '../../../../utils/walletExport'
import { AssistantLoadingCards } from './AssistantEmptyState'
import { CardGroupList } from './CardGroupList'
import { ContextSummary } from './ContextSummary'
import { FollowUpInput } from './FollowUpInput'
import { GuidedStepPanel } from './GuidedStepPanel'
import { NavigatorEntry } from './NavigatorEntry'
import { SessionHeader } from './SessionHeader'
import { SummaryCard } from './SummaryCard'
import { WalletPanel, WalletToolbar } from './WalletPanel'
import { MyInfoPanel } from '../MyInfoPanel'

function AssistantWorkspaceContent() {
  const { t } = useLocale()
  const { goToChooseMode, refresh: refreshGuided } = useGuidedInterview()
  const location = useLocation()
  const {
    activeSession,
    cardGroups,
    latestCardGroup,
    summary,
    walletItems,
    showGuidedSteps,
    guidedQuestions,
    loading,
    error,
    submitPrompt,
    submitGuidedAnswer,
    revertGuidedAnswer,
    addCardToWallet,
    addSessionToWallet,
    addSummaryToWallet,
    isSummaryInWallet,
    removeFromWallet,
    isCardInWallet,
    refresh,
  } = useAssistantSession()

  const [walletOpen, setWalletOpen] = useState(false)
  const [followUpCard, setFollowUpCard] = useState(null)
  const [myInfoOpen, setMyInfoOpen] = useState(false)
  const seedConsumedRef = useRef(false)

  const hasSession = Boolean(
    cardGroups?.length || activeSession?.guidedState,
  )

  // One-time router seed: when navigated here with a seed in history state and
  // there is no active session yet, kick off the prompt automatically.
  useEffect(() => {
    if (seedConsumedRef.current) return
    const seed = location.state?.seed
    if (!seed?.prompt) return
    if (activeSession) return
    seedConsumedRef.current = true
    submitPrompt(seed.prompt, { intent: seed.intent })
    // Clear the seed from history state so a refresh / back nav doesn't re-fire.
    if (typeof window !== 'undefined') {
      window.history.replaceState({ ...window.history.state, usr: null }, '')
    }
  }, [location.state, activeSession, submitPrompt])

  const contextSummary = activeSession?.guidedState?.contextSummary

  const handleStart = (seed) => submitPrompt(seed.prompt, { intent: seed.intent })

  // A single follow-up box. When a card context is set (via "Ask about this
  // card"), the question is tagged with that card; otherwise it's a plain
  // follow-up.
  const handlePrompt = (text) => {
    if (followUpCard) {
      submitPrompt(`${t('assistant.followUp.aboutPrefix')} "${followUpCard.title}": ${text}`)
      setFollowUpCard(null)
    } else {
      submitPrompt(text)
    }
  }
  const handleAskAboutCard = (card) => setFollowUpCard(card)
  const handleGuidedBack = (questionId) => revertGuidedAnswer(questionId)

  const handleDownloadSession = () => {
    if (latestCardGroup?.walletBundle) {
      downloadWalletBundleAsPdf(latestCardGroup.walletBundle)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goToChooseMode}
          className="text-sm font-medium text-civic-purple hover:underline"
        >
          ← {t('help.backToChoose')}
        </button>
        <button
          type="button"
          onClick={() => setMyInfoOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal hover:border-civic-purple hover:text-civic-purple"
        >
          <ShieldCheck size={14} aria-hidden="true" />
          {t('myInfo.open')}
        </button>
      </div>

      {hasSession && (
        <header className="mb-6">
          <h1 className="text-xl font-bold text-charcoal sm:text-2xl">
            {t('assistant.header.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('assistant.header.subtitle')}</p>
        </header>
      )}

      {!hasSession ? (
        <NavigatorEntry onStart={handleStart} loading={loading} error={error} />
      ) : (
        <div className="flex flex-col gap-5 pb-4">
          <SessionHeader
            originalPrompt={activeSession.originalPrompt}
            followUpPrompts={activeSession.followUpPrompts}
          />

          {showGuidedSteps && (
            <>
              <p className="text-sm text-slate-600">
                {activeSession.guidedState?.intro}
              </p>
              <ContextSummary contextSummary={contextSummary} />
              <AnimatePresence mode="wait">
                <GuidedStepPanel
                  key={guidedQuestions.map((q) => activeSession.guidedAnswers?.[q.id]).join('-')}
                  questions={guidedQuestions}
                  answers={activeSession.guidedAnswers ?? {}}
                  onSubmitAnswer={submitGuidedAnswer}
                  onBack={handleGuidedBack}
                  loading={loading}
                />
              </AnimatePresence>
            </>
          )}

          {!showGuidedSteps && (
            <>
              {loading && !cardGroups.length ? (
                <AssistantLoadingCards />
              ) : (
                <div className="space-y-4">
                  {summary && (
                    <SummaryCard
                      summary={summary}
                      onAddToWallet={addSummaryToWallet}
                      inWallet={isSummaryInWallet()}
                    />
                  )}

                  <WalletToolbar
                    walletCount={walletItems.length}
                    onSaveAll={addSessionToWallet}
                    onDownloadBundle={handleDownloadSession}
                    onToggleWallet={() => setWalletOpen((v) => !v)}
                    walletOpen={walletOpen}
                    saving={loading}
                  />

                  {walletOpen && (
                    <WalletPanel items={walletItems} onRemove={removeFromWallet} />
                  )}

                  <p className="text-sm font-medium text-slate-500">
                    {t('navigator.cardsHint')}
                  </p>

                  <CardGroupList
                    cardGroups={cardGroups}
                    onAddToWallet={addCardToWallet}
                    isCardInWallet={isCardInWallet}
                    onAskAbout={handleAskAboutCard}
                  />

                  {loading && <AssistantLoadingCards />}
                </div>
              )}
            </>
          )}

          <FollowUpInput
            onSubmit={handlePrompt}
            loading={loading}
            contextLabel={
              followUpCard
                ? `${t('assistant.followUp.aboutPrefix')}: ${followUpCard.title}`
                : null
            }
            onClearContext={() => setFollowUpCard(null)}
          />

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>
      )}

      <MyInfoPanel
        open={myInfoOpen}
        onClose={() => setMyInfoOpen(false)}
        onChanged={async () => {
          await refresh()
          await refreshGuided?.()
        }}
      />
    </div>
  )
}

export function AssistantWorkspace() {
  return (
    <AssistantProvider>
      <AssistantWorkspaceContent />
    </AssistantProvider>
  )
}
