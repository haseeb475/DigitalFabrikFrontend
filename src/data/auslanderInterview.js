export const AUSLANDER_STEPS = [
  {
    id: 'journey-stage',
    type: 'radio',
    questionKey: 'auslander.step1.question',
    answerKey: 'journeyStage',
    options: [
      { value: 'abroad', labelKey: 'auslander.step1.abroad' },
      { value: 'just_arrived', labelKey: 'auslander.step1.justArrived' },
      { value: 'few_months', labelKey: 'auslander.step1.fewMonths' },
      { value: 'settled', labelKey: 'auslander.step1.settled' },
    ],
  },
  {
    id: 'visa-status',
    type: 'radio',
    questionKey: 'auslander.step2.question',
    answerKey: 'visaStatus',
    options: [
      { value: 'tourist', labelKey: 'auslander.step2.tourist' },
      { value: 'student', labelKey: 'auslander.step2.student' },
      { value: 'work', labelKey: 'auslander.step2.work' },
      { value: 'asylum', labelKey: 'auslander.step2.asylum' },
      { value: 'other', labelKey: 'auslander.step2.other' },
    ],
  },
  {
    id: 'primary-goal',
    type: 'radio',
    questionKey: 'auslander.step3.question',
    answerKey: 'primaryGoal',
    options: [
      { value: 'first_permit', labelKey: 'auslander.step3.firstPermit' },
      { value: 'renewal', labelKey: 'auslander.step3.renewal' },
      { value: 'extension', labelKey: 'auslander.step3.extension' },
      { value: 'change_status', labelKey: 'auslander.step3.changeStatus' },
      { value: 'registration', labelKey: 'auslander.step3.registration' },
    ],
  },
  {
    id: 'documents-held',
    type: 'checkbox',
    questionKey: 'auslander.step4.question',
    subtitleKey: 'auslander.step4.subtitle',
    answerKey: 'documentsHeld',
    options: [
      { value: 'passport', labelKey: 'auslander.documents.passport' },
      { value: 'photos', labelKey: 'auslander.documents.photos' },
      { value: 'insurance', labelKey: 'auslander.documents.insurance' },
      { value: 'anmeldung', labelKey: 'auslander.documents.anmeldung' },
      { value: 'current_permit', labelKey: 'auslander.documents.currentPermit' },
      { value: 'employment_contract', labelKey: 'auslander.documents.employmentContract' },
      { value: 'rental_contract', labelKey: 'auslander.documents.rentalContract' },
      { value: 'fiktionsbescheinigung', labelKey: 'auslander.documents.fiktion' },
    ],
  },
  {
    id: 'appointment-status',
    type: 'radio',
    questionKey: 'auslander.step5.question',
    answerKey: 'appointmentStatus',
    options: [
      { value: 'none', labelKey: 'auslander.step5.none' },
      { value: 'scheduled', labelKey: 'auslander.step5.scheduled' },
      { value: 'waiting', labelKey: 'auslander.step5.waiting' },
      { value: 'completed', labelKey: 'auslander.step5.completed' },
    ],
  },
  {
    id: 'confirm',
    type: 'confirm',
    questionKey: 'auslander.step6.title',
    descriptionKey: 'auslander.step6.description',
  },
]

export const TOTAL_AUSLANDER_STEPS = AUSLANDER_STEPS.length

export const POPULAR_TOPICS = [
  { id: 'anmeldung', labelKey: 'auslander.topics.anmeldung', nodeId: 'arrival' },
  { id: 'aufenthalt', labelKey: 'auslander.topics.aufenthalt', nodeId: 'residence-permit' },
  { id: 'renewal', labelKey: 'auslander.topics.renewal', nodeId: 'residence-permit' },
  { id: 'insurance', labelKey: 'auslander.topics.insurance', nodeId: 'arrival' },
  { id: 'work', labelKey: 'auslander.topics.work', nodeId: 'work-career' },
  { id: 'rights', labelKey: 'auslander.topics.rights', nodeId: 'legal-rights' },
]
