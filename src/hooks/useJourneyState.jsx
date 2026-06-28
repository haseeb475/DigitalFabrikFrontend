import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getFlowForNode } from '../data/flows'
import { apiService } from '../services/mockApi'

const JourneyContext = createContext(null)

function getViewMode(session, nodeId) {
  if (!nodeId) return 'empty'
  const node = session?.nodes?.[nodeId]
  if (!node || node.status === 'locked') return 'empty'
  if (node.interview?.completed) return 'actions'
  return 'intake'
}

export function JourneyProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionData, setActionData] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const activeNodeId = session?.activeNodeId ?? null
  const viewMode = getViewMode(session, activeNodeId)

  const activeNode = activeNodeId ? session?.nodes?.[activeNodeId] : null
  const currentStep = activeNode?.interview?.currentStep ?? 0
  const flow = activeNodeId ? getFlowForNode(activeNodeId) : null
  const stepData = flow?.steps?.[currentStep] ?? null

  const refreshProgress = useCallback(async () => {
    const data = await apiService.fetchUserProgress()
    setSession(data)
    return data
  }, [])

  useEffect(() => {
    refreshProgress().finally(() => setLoading(false))
  }, [refreshProgress])

  useEffect(() => {
    if (viewMode !== 'actions' || !activeNodeId) {
      setActionData(null)
      return
    }

    setActionLoading(true)
    apiService
      .fetchActionCards(activeNodeId)
      .then(setActionData)
      .finally(() => setActionLoading(false))
  }, [viewMode, activeNodeId, session])

  const selectNode = useCallback(
    async (nodeId) => {
      const node = session?.nodes?.[nodeId]
      if (!node || node.status === 'locked') return

      setLoading(true)
      try {
        const updated = await apiService.saveActiveNode(nodeId)
        setSession(updated)
      } finally {
        setLoading(false)
      }
    },
    [session],
  )

  const saveAndAdvance = useCallback(
    async (answers) => {
      if (!activeNodeId || !flow) return

      setLoading(true)
      try {
        let updated = await apiService.saveInterviewAnswers(
          activeNodeId,
          currentStep,
          answers,
        )

        const isLastStep = currentStep >= flow.totalSteps - 1
        if (isLastStep) {
          updated = await apiService.completeInterview(activeNodeId)
        }

        setSession(updated)
      } finally {
        setLoading(false)
      }
    },
    [activeNodeId, currentStep, flow],
  )

  const goBack = useCallback(async () => {
    if (!activeNodeId || currentStep <= 0) return

    setLoading(true)
    try {
      const updated = await apiService.setInterviewStep(
        activeNodeId,
        currentStep - 1,
      )
      setSession(updated)
    } finally {
      setLoading(false)
    }
  }, [activeNodeId, currentStep])

  const currentAnswers = activeNode?.interview?.answers ?? {}

  const value = useMemo(
    () => ({
      session,
      loading,
      activeNodeId,
      viewMode,
      currentStep,
      flow,
      stepData,
      currentAnswers,
      actionData,
      actionLoading,
      selectNode,
      saveAndAdvance,
      goBack,
      refreshProgress,
    }),
    [
      session,
      loading,
      activeNodeId,
      viewMode,
      currentStep,
      flow,
      stepData,
      currentAnswers,
      actionData,
      actionLoading,
      selectNode,
      saveAndAdvance,
      goBack,
      refreshProgress,
    ],
  )

  return (
    <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>
  )
}

export function useJourneyState() {
  const context = useContext(JourneyContext)
  if (!context) {
    throw new Error('useJourneyState must be used within JourneyProvider')
  }
  return context
}
