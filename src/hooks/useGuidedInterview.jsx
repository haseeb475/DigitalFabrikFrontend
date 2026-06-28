import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AUSLANDER_STEPS } from '../data/auslanderInterview'
import { resolveRequiredDocuments } from '../data/documentRules'
import { apiService } from '../services/mockApi'

const GuidedInterviewContext = createContext(null)

export function GuidedInterviewProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [documentResults, setDocumentResults] = useState(null)

  const helpFlow = session?.helpFlow ?? {}
  const phase = helpFlow.phase ?? 'choose'
  const currentStep = helpFlow.currentStep ?? 0
  const answers = helpFlow.answers ?? {}
  const stepData = AUSLANDER_STEPS[currentStep] ?? null

  const refresh = useCallback(async () => {
    const data = await apiService.fetchUserProgress()
    setSession(data)
    return data
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    if (phase === 'results' && answers) {
      setDocumentResults(resolveRequiredDocuments(answers))
    }
  }, [phase, answers])

  const startInterview = useCallback(async () => {
    setLoading(true)
    try {
      const updated = await apiService.startGuidedInterview()
      setSession(updated)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveStepAndAdvance = useCallback(
    async (stepAnswers) => {
      setLoading(true)
      try {
        const updated = await apiService.saveGuidedInterviewStep(
          currentStep,
          stepAnswers,
        )
        setSession(updated)
      } finally {
        setLoading(false)
      }
    },
    [currentStep],
  )

  const goBackStep = useCallback(async () => {
    if (currentStep <= 0) {
      const updated = await apiService.setHelpPhase('choose')
      setSession(updated)
      return
    }
    setLoading(true)
    try {
      const updated = await apiService.setGuidedInterviewStep(currentStep - 1)
      setSession(updated)
    } finally {
      setLoading(false)
    }
  }, [currentStep])

  const completeInterview = useCallback(async () => {
    setLoading(true)
    try {
      const updated = await apiService.completeGuidedInterview()
      setSession(updated)
      setDocumentResults(resolveRequiredDocuments(updated.helpFlow?.answers))
    } finally {
      setLoading(false)
    }
  }, [])

  const goToChooseMode = useCallback(async () => {
    setLoading(true)
    try {
      const updated = await apiService.setHelpPhase('choose')
      setSession(updated)
    } finally {
      setLoading(false)
    }
  }, [])

  const finishAndExplore = useCallback(async () => {
    setLoading(true)
    try {
      const updated = await apiService.finishHelpFlow()
      setSession(updated)
    } finally {
      setLoading(false)
    }
  }, [])

  const showAssistant = useCallback(async () => {
    setLoading(true)
    try {
      const updated = await apiService.setHelpPhase('assistant')
      setSession(updated)
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      phase,
      currentStep,
      answers,
      stepData,
      totalSteps: AUSLANDER_STEPS.length,
      documentResults,
      startInterview,
      saveStepAndAdvance,
      goBackStep,
      completeInterview,
      goToChooseMode,
      finishAndExplore,
      showAssistant,
      refresh,
    }),
    [
      session,
      loading,
      phase,
      currentStep,
      answers,
      stepData,
      documentResults,
      startInterview,
      saveStepAndAdvance,
      goBackStep,
      completeInterview,
      goToChooseMode,
      finishAndExplore,
      showAssistant,
      refresh,
    ],
  )

  return (
    <GuidedInterviewContext.Provider value={value}>
      {children}
    </GuidedInterviewContext.Provider>
  )
}

export function useGuidedInterview() {
  const ctx = useContext(GuidedInterviewContext)
  if (!ctx) {
    throw new Error('useGuidedInterview must be used within GuidedInterviewProvider')
  }
  return ctx
}
