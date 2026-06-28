import { useGuidedInterview } from '../../../hooks/useGuidedInterview'
import { DocumentChecklist } from './DocumentChecklist'

export function InterviewResults() {
  const { documentResults } = useGuidedInterview()
  return <DocumentChecklist items={documentResults ?? []} showCta />
}
