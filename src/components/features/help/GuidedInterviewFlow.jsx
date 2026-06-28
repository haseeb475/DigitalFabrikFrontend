import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useLocale } from '../../../i18n/useLocale'
import { useGuidedInterview } from '../../../hooks/useGuidedInterview'
import { Button } from '../../ui/Button'
import { CheckboxGroup } from '../../ui/CheckboxGroup'
import { ProgressBar } from '../../ui/ProgressBar'
import { RadioGroup } from '../../ui/RadioGroup'

const DOCUMENT_KEYS = {
  passport: 'auslander.documents.passport',
  photos: 'auslander.documents.photos',
  insurance: 'auslander.documents.insurance',
  anmeldung: 'auslander.documents.anmeldung',
  current_permit: 'auslander.documents.currentPermit',
  employment_contract: 'auslander.documents.employmentContract',
  rental_contract: 'auslander.documents.rentalContract',
  fiktionsbescheinigung: 'auslander.documents.fiktion',
}

const GOAL_KEYS = {
  first_permit: 'auslander.step3.firstPermit',
  renewal: 'auslander.step3.renewal',
  extension: 'auslander.step3.extension',
  change_status: 'auslander.step3.changeStatus',
  registration: 'auslander.step3.registration',
}

const VISA_KEYS = {
  tourist: 'auslander.step2.tourist',
  student: 'auslander.step2.student',
  work: 'auslander.step2.work',
  asylum: 'auslander.step2.asylum',
  other: 'auslander.step2.other',
}

export function GuidedInterviewFlow() {
  const { t } = useLocale()
  const {
    stepData,
    currentStep,
    totalSteps,
    answers,
    saveStepAndAdvance,
    goBackStep,
    goToChooseMode,
    loading,
  } = useGuidedInterview()

  const panelRef = useRef(null)
  const [localValue, setLocalValue] = useState(null)
  const [localMulti, setLocalMulti] = useState([])

  useEffect(() => {
    if (!stepData) return
    if (stepData.type === 'radio') {
      setLocalValue(answers[stepData.answerKey] ?? null)
    } else if (stepData.type === 'checkbox') {
      setLocalMulti(answers[stepData.answerKey] ?? [])
    }
  }, [stepData, answers, currentStep])

  useEffect(() => {
    panelRef.current?.focus()
  }, [currentStep])

  if (!stepData) return null

  const stepLabel = t('help.stepOf', { current: currentStep + 1, total: totalSteps })
  const isLastStep = currentStep >= totalSteps - 1

  const canProceed = () => {
    if (stepData.type === 'radio') return localValue !== null
    if (stepData.type === 'checkbox') return true
    return true
  }

  const handleNext = async () => {
    if (stepData.type === 'radio') {
      await saveStepAndAdvance({ [stepData.answerKey]: localValue })
    } else if (stepData.type === 'checkbox') {
      await saveStepAndAdvance({ [stepData.answerKey]: localMulti })
    } else {
      await saveStepAndAdvance({})
    }
  }

  const renderContent = () => {
    if (stepData.type === 'radio') {
      return (
        <RadioGroup
          name={stepData.id}
          legend={t(stepData.questionKey)}
          options={stepData.options.map((opt) => ({
            value: opt.value,
            label: t(opt.labelKey),
          }))}
          value={localValue}
          onChange={setLocalValue}
        />
      )
    }

    if (stepData.type === 'checkbox') {
      return (
        <div>
          {stepData.subtitleKey && (
            <p className="mb-4 text-sm text-slate-500">{t(stepData.subtitleKey)}</p>
          )}
          <CheckboxGroup
            name={stepData.id}
            legend={t(stepData.questionKey)}
            options={stepData.options.map((opt) => ({
              value: opt.value,
              label: t(opt.labelKey),
            }))}
            values={localMulti}
            onChange={setLocalMulti}
          />
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-charcoal">{t(stepData.questionKey)}</h2>
        <p className="text-sm leading-relaxed text-slate-600">{t(stepData.descriptionKey)}</p>
        <dl className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
          {answers.visaStatus && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t('auslander.summary.visaStatus')}
              </dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {t(VISA_KEYS[answers.visaStatus] ?? answers.visaStatus)}
              </dd>
            </div>
          )}
          {answers.primaryGoal && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t('auslander.summary.goal')}
              </dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {t(GOAL_KEYS[answers.primaryGoal] ?? answers.primaryGoal)}
              </dd>
            </div>
          )}
          {answers.documentsHeld?.length > 0 && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t('auslander.summary.documents')}
              </dt>
              <dd className="mt-0.5 font-medium text-charcoal">
                {answers.documentsHeld.map((d) => t(DOCUMENT_KEYS[d])).join(', ')}
              </dd>
            </div>
          )}
        </dl>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={goToChooseMode}
          className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-purple"
          aria-label={t('help.backToChoose')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-charcoal">{t('help.guided.flowTitle')}</h1>
      </div>

      <div
        ref={panelRef}
        tabIndex={-1}
        className="rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm outline-none sm:p-6"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-slate-500">{stepLabel}</p>
        <ProgressBar current={currentStep + 1} total={totalSteps} className="mt-2 mb-6" />

        {renderContent()}

        <div className="mt-8 flex gap-3">
          <Button
            variant="ghost"
            onClick={goBackStep}
            disabled={loading}
            className="flex-1"
          >
            {t('intake.back')}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="flex-1"
          >
            {loading
              ? t('common.loading')
              : isLastStep
                ? t('help.guided.finish')
                : t('intake.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
