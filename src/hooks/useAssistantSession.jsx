import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiService } from '../services/mockApi'
import { buildSummaryCard } from '../data/assistantMock'

const AssistantContext = createContext(null)

// Module-level guard: false in every fresh page-load (including a browser
// refresh), but preserved across in-app remounts of the provider. We use it to
// clear the assistant conversation exactly once per page load so a refresh
// returns the user to a clean Navigator entry view.
let assistantBootReset = false

export function AssistantProvider({ children }) {
  const [assistantState, setAssistantState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    const data = await apiService.getAssistantSessions()
    setAssistantState(data)
    return data
  }, [])

  useEffect(() => {
    async function boot() {
      // Reset the workspace once per page load so a refresh clears any prior
      // conversation and the user starts at the Navigator entry.
      if (!assistantBootReset) {
        assistantBootReset = true
        try {
          await apiService.clearAssistantSessions()
        } catch {
          // ignore — refresh fallback below still yields an empty workspace
        }
      }
      try {
        const data = await apiService.getAssistantSessions()
        setAssistantState(data)
      } catch {
        setAssistantState({ activeSessionId: null, sessions: [], wallet: [] })
      }
    }
    boot()
  }, [])

  const activeSession = useMemo(() => {
    if (!assistantState?.activeSessionId) return null
    return (
      assistantState.sessions.find((s) => s.id === assistantState.activeSessionId) ??
      null
    )
  }, [assistantState])

  // The full stream of card groups, sorted oldest → newest so follow-up
  // results append below earlier ones (Req 6.1, 6.2).
  const cardGroups = useMemo(() => {
    const groups = activeSession?.cardGroups ?? []
    return [...groups].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    )
  }, [activeSession])

  // Convenience handle on the most recent group (used by the wallet toolbar /
  // session download).
  const latestCardGroup = useMemo(() => {
    if (!cardGroups.length) return null
    return cardGroups[cardGroups.length - 1]
  }, [cardGroups])

  // Backward-compatible alias for existing consumers.
  const currentCardGroup = latestCardGroup

  // Derived, session-level summary pinned above the card stream. Uses the
  // session's established intent, the merged guided answers, and the latest
  // group's cards to surface the single most important next step.
  const summary = useMemo(() => {
    if (!activeSession) return null
    return buildSummaryCard({
      goalLabel: activeSession.originalPrompt ?? null,
      intent: activeSession.intent,
      answers: activeSession.guidedAnswers ?? {},
      cards: latestCardGroup?.cards ?? [],
    })
  }, [activeSession, latestCardGroup])

  const walletItems = useMemo(() => assistantState?.wallet ?? [], [assistantState])

  const showGuidedSteps = useMemo(
    () => activeSession?.guidedState?.status === 'needs_more_info',
    [activeSession],
  )

  const guidedQuestions = useMemo(
    () => activeSession?.guidedState?.guidedQuestions ?? [],
    [activeSession],
  )

  const submitPrompt = useCallback(
    async (prompt, { intent } = {}) => {
      if (!prompt.trim()) return null
      setLoading(true)
      setError(null)
      try {
        const result = await apiService.submitAssistantPrompt({
          prompt: prompt.trim(),
          sessionId: activeSession?.id ?? null,
          intent: intent ?? null,
        })
        await refresh()
        return result
      } catch (err) {
        setError(err.message ?? 'Unknown error')
        return null
      } finally {
        setLoading(false)
      }
    },
    [activeSession, refresh],
  )

  const submitGuidedAnswer = useCallback(
    async (questionId, value) => {
      if (!activeSession) return null
      setLoading(true)
      setError(null)
      try {
        const result = await apiService.submitGuidedAnswer({
          sessionId: activeSession.id,
          questionId,
          value,
        })
        await refresh()
        return result
      } catch (err) {
        setError(err.message ?? 'Unknown error')
        return null
      } finally {
        setLoading(false)
      }
    },
    [activeSession, refresh],
  )

  const revertGuidedAnswer = useCallback(
    async (questionId) => {
      if (!activeSession) return
      await apiService.revertGuidedAnswer({
        sessionId: activeSession.id,
        questionId,
      })
      await refresh()
    },
    [activeSession, refresh],
  )

  const addCardToWallet = useCallback(
    async (cardId) => {
      if (!activeSession) return null
      setLoading(true)
      try {
        const result = await apiService.addCardToWallet({
          sessionId: activeSession.id,
          cardId,
        })
        await refresh()
        return result
      } finally {
        setLoading(false)
      }
    },
    [activeSession, refresh],
  )

  const addSessionToWallet = useCallback(async () => {
    if (!activeSession) return null
    setLoading(true)
    try {
      const result = await apiService.addSessionToWallet({
        sessionId: activeSession.id,
      })
      await refresh()
      return result
    } finally {
      setLoading(false)
    }
  }, [activeSession, refresh])

  const addSummaryToWallet = useCallback(async () => {
    if (!activeSession) return null
    setLoading(true)
    try {
      const result = await apiService.addSummaryToWallet({
        sessionId: activeSession.id,
      })
      await refresh()
      return result
    } finally {
      setLoading(false)
    }
  }, [activeSession, refresh])

  const isSummaryInWallet = useCallback(() => {
    if (!activeSession) return false
    return walletItems.some(
      (w) =>
        w.type === 'card' &&
        w.sessionId === activeSession.id &&
        w.cardId === 'summary',
    )
  }, [walletItems, activeSession])

  const removeFromWallet = useCallback(
    async (walletItemId) => {
      await apiService.removeFromWallet(walletItemId)
      await refresh()
    },
    [refresh],
  )

  const isCardInWallet = useCallback(
    (cardId) => {
      if (!activeSession) return false
      return walletItems.some(
        (w) => w.type === 'card' && w.sessionId === activeSession.id && w.cardId === cardId,
      )
    },
    [walletItems, activeSession],
  )

  const value = useMemo(
    () => ({
      assistantState,
      activeSession,
      cardGroups,
      latestCardGroup,
      currentCardGroup,
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
    }),
    [
      assistantState,
      activeSession,
      cardGroups,
      latestCardGroup,
      currentCardGroup,
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
    ],
  )

  return (
    <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
  )
}

export function useAssistantSession() {
  const ctx = useContext(AssistantContext)
  if (!ctx) {
    throw new Error('useAssistantSession must be used within AssistantProvider')
  }
  return ctx
}
