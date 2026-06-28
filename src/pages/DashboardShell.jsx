import { useEffect, useState } from 'react'
import { resolveRequiredDocuments } from '../data/documentRules'
import { GuidedInterviewProvider, useGuidedInterview } from '../hooks/useGuidedInterview'
import { JourneyProvider } from '../hooks/useJourneyState'
import { HelpHub } from '../components/features/help/HelpHub'
import { DocumentChecklist } from '../components/features/help/DocumentChecklist'
import { HelpLayout } from '../components/layout/HelpLayout'
import { AppLayout } from '../components/layout/AppLayout'
import { TopicMap } from '../components/features/TopicMap'
import { RightPanel } from '../components/features/RightPanel'
import { BottomNav } from '../components/layout/BottomNav'

function JourneyView() {
  return (
    <JourneyProvider>
      <div className="grid gap-6 lg:grid-cols-2">
        <TopicMap />
        <RightPanel />
      </div>
    </JourneyProvider>
  )
}

function DashboardContent() {
  const { session, refresh } = useGuidedInterview()
  const phase = session?.helpFlow?.phase ?? 'choose'
  const isHelpComplete = phase === 'complete'
  const [mobileTab, setMobileTab] = useState('help')

  useEffect(() => {
    if (isHelpComplete) {
      setMobileTab('documents')
    }
  }, [isHelpComplete])

  const handleNav = (tab) => {
    if (tab === 'help') setMobileTab('help')
    else if (tab === 'map' && isHelpComplete) setMobileTab('map')
    else if (tab === 'documents' && isHelpComplete) setMobileTab('documents')
  }

  const handleTopicNavigate = async () => {
    await refresh()
    if (session?.helpFlow?.phase === 'complete') {
      setMobileTab('map')
    }
  }

  const activeTab =
    mobileTab === 'map' ? 'map' : mobileTab === 'documents' ? 'documents' : 'help'

  const documents = resolveRequiredDocuments(session?.helpFlow?.answers ?? {})
  const bottomNav = (
    <BottomNav
      active={isHelpComplete ? activeTab : 'help'}
      helpComplete={isHelpComplete}
      onNavigate={handleNav}
    />
  )

  const isAssistantPhase =
    phase === 'assistant' || phase === 'topics'

  // Onboarding: no sidebar, no map — matches landing page shell
  if (!isHelpComplete) {
    return (
      <HelpLayout bottomNav={bottomNav}>
        <HelpHub onNavigate={handleTopicNavigate} />
      </HelpLayout>
    )
  }

  // Post-onboarding: tabbed views; map only when user picks Map
  return (
    <AppLayout bottomNav={bottomNav}>
      {mobileTab === 'help' && (
        <div className={`mx-auto ${isAssistantPhase ? 'max-w-6xl' : 'max-w-lg'}`}>
          <HelpHub onNavigate={handleTopicNavigate} />
        </div>
      )}
      {mobileTab === 'documents' && (
        <DocumentChecklist items={documents} showCta={false} />
      )}
      {mobileTab === 'map' && <JourneyView />}
    </AppLayout>
  )
}

export function DashboardShell() {
  return (
    <GuidedInterviewProvider>
      <DashboardContent />
    </GuidedInterviewProvider>
  )
}
