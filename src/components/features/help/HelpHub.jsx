import { useGuidedInterview } from '../../../hooks/useGuidedInterview'
import { ChooseHelpMode } from './ChooseHelpMode'
import { GuidedInterviewFlow } from './GuidedInterviewFlow'
import { InterviewResults } from './InterviewResults'
import { AssistantWorkspace } from './assistant/AssistantWorkspace'

export function HelpHub({ onNavigate: _onNavigate }) {
  const { phase, loading } = useGuidedInterview()

  if (loading && phase === 'choose') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-civic-purple border-t-transparent" />
      </div>
    )
  }

  switch (phase) {
    case 'interview':
      return <GuidedInterviewFlow />
    case 'results':
      return <InterviewResults />
    case 'assistant':
    case 'topics':
      return <AssistantWorkspace />
    case 'choose':
    default:
      return <ChooseHelpMode />
  }
}
