import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../../i18n/useLocale'
import { useJourneyState } from '../../hooks/useJourneyState'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { CheckboxGroup } from '../ui/CheckboxGroup'
import { ProgressBar } from '../ui/ProgressBar'
import { RadioGroup } from '../ui/RadioGroup'
import { StepIndicator } from '../ui/StepIndicator'

export function IntakeDeck() {
  const { t } = useLocale()
  const { flow, stepData, currentStep, currentAnswers, saveAndAdvance, goBack, loading } =
    useJourneyState()
  const deckRef = useRef(null)

  const [localValue, setLocalValue] = useState(null)
  const [localMulti, setLocalMulti] = useState([])

  useEffect(() => {
    if (!stepData) return

    if (stepData.type === 'radio') {
      setLocalValue(currentAnswers[stepData.answerKey] ?? null)
    } else if (stepData.type === 'checkbox') {
      setLocalMulti(currentAnswers[stepData.answerKey] ?? [])
    }
  }, [stepData, currentAnswers, currentStep])

  useEffect(() => {
    deckRef.current?.focus()
  }, [currentStep])

  if (!flow || !stepData) return null

  const totalSteps = flow.totalSteps
  const stepLabel = t('intake.stepOf', { current: currentStep + 1, total: totalSteps })

  const canProceed = () => {
    if (stepData.type === 'radio') return localValue !== null
    if (stepData.type === 'checkbox') return localMulti.length > 0
    return true
  }

  const handleNext = () => {
    if (stepData.type === 'radio') {
      saveAndAdvance({ [stepData.answerKey]: localValue })
    } else if (stepData.type === 'checkbox') {
      saveAndAdvance({ [stepData.answerKey]: localMulti })
    } else {
      saveAndAdvance({})
    }
  }

  const isLastStep = currentStep >= totalSteps - 1

  const renderStepContent = () => {
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
      )
    }

    if (stepData.type === 'summary') {
      const statusKey = currentAnswers.visaStatus ?? currentAnswers.arrivalStatus
      const docs = currentAnswers.documents ?? []

      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-charcoal">{t(stepData.questionKey)}</h3>
          <p className="text-sm text-slate-600">{t(stepData.descriptionKey)}</p>
          <dl className="space-y-3 rounded-lg bg-slate-50 p-4">
            {(currentAnswers.visaStatus || currentAnswers.arrivalStatus) && (
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500">
                  {t('intake.summary.visaStatus')}
                </dt>
                <dd className="mt-1 text-sm font-medium text-charcoal">
                  {statusKey
                    ? t(
                        stepData.id.includes('arrival')
                          ? `intake.arrival.step1.${statusKey}`
                          : `intake.residence.step1.${statusKey}`,
                      )
                    : '—'}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">
                {t('intake.summary.documents')}
              </dt>
              <dd className="mt-1 text-sm font-medium text-charcoal">
                {docs.length > 0
                  ? docs.map((d) => t(`intake.documents.${d}`)).join(', ')
                  : t('intake.summary.none')}
              </dd>
            </div>
          </dl>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-charcoal">{t(stepData.questionKey)}</h3>
        <p className="text-sm text-slate-600">{t(stepData.descriptionKey)}</p>
      </div>
    )
  }

  return (
    <Card
      ref={deckRef}
      tabIndex={-1}
      className="flex flex-col outline-none"
      aria-live="polite"
    >
      <StepIndicator current={currentStep + 1} total={totalSteps} label={stepLabel} />
      <ProgressBar current={currentStep + 1} total={totalSteps} className="mb-6" />

      <div className="flex-1">{renderStepContent()}</div>

      <div className="mt-8 flex gap-3">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={currentStep === 0 || loading}
          className="flex-1"
        >
          {t('intake.back')}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="flex-1"
        >
          {loading ? t('common.loading') : isLastStep ? t('intake.finish') : t('intake.next')}
        </Button>
      </div>
    </Card>
  )
}
