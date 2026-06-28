import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocale } from '../../../../i18n/useLocale'
import { Button } from '../../../ui/Button'
import { ProgressBar } from '../../../ui/ProgressBar'
import { RadioGroup } from '../../../ui/RadioGroup'

export function GuidedStepPanel({ questions, answers, onSubmitAnswer, onBack, loading }) {
  const { t } = useLocale()
  const panelRef = useRef(null)
  const [localValue, setLocalValue] = useState(null)

  const requiredQuestions = questions.filter((q) => q.required !== false)
  const currentIndex = requiredQuestions.findIndex((q) => !answers[q.id])
  const currentQuestion = requiredQuestions[currentIndex] ?? null
  const totalSteps = requiredQuestions.length
  const stepNumber = currentIndex + 1

  useEffect(() => {
    if (currentQuestion) {
      setLocalValue(answers[currentQuestion.id] ?? null)
    }
  }, [currentQuestion?.id, answers, currentQuestion])

  useEffect(() => {
    panelRef.current?.focus()
  }, [currentQuestion?.id])

  if (!currentQuestion) return null

  const stepLabel = t('assistant.guided.stepOf', {
    current: stepNumber,
    total: totalSteps,
  })

  const handleNext = () => {
    if (localValue == null || loading) return
    onSubmitAnswer(currentQuestion.id, localValue)
  }

  const handleBack = () => {
    if (currentIndex <= 0) return
    onBack(requiredQuestions[currentIndex].id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      ref={panelRef}
      tabIndex={-1}
      className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm outline-none sm:p-6"
      aria-live="polite"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-civic-purple">
        {t('assistant.guided.badge')}
      </p>
      <ProgressBar current={stepNumber} total={totalSteps} className="mt-3 mb-1" />
      <p className="mb-5 text-sm text-slate-500">{stepLabel}</p>

      {currentQuestion.type === 'select' ? (
        <div>
          <label
            htmlFor={currentQuestion.id}
            className="mb-3 block text-lg font-semibold text-charcoal"
          >
            {currentQuestion.question}
          </label>
          <select
            id={currentQuestion.id}
            value={localValue ?? ''}
            onChange={(e) => setLocalValue(e.target.value || null)}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-charcoal focus:border-civic-purple focus:outline-none focus:ring-2 focus:ring-civic-purple/20"
          >
            <option value="">{t('assistant.guided.selectPlaceholder')}</option>
            {currentQuestion.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <RadioGroup
          name={currentQuestion.id}
          legend={currentQuestion.question}
          options={currentQuestion.options}
          value={localValue}
          onChange={setLocalValue}
        />
      )}

      <div className="mt-8 flex gap-3">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentIndex <= 0 || loading}
          className="flex-1"
        >
          {t('intake.back')}
        </Button>
        <Button
          onClick={handleNext}
          disabled={localValue == null || loading}
          className="flex-1"
        >
          {loading
            ? t('common.loading')
            : stepNumber >= totalSteps
              ? t('assistant.guided.finish')
              : t('intake.next')}
        </Button>
      </div>
    </motion.div>
  )
}
