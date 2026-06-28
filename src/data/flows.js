export const NODE_IDS = {
  ARRIVAL: 'arrival',
  RESIDENCE_PERMIT: 'residence-permit',
  LEGAL_RIGHTS: 'legal-rights',
  WORK_CAREER: 'work-career',
}

export const NODE_LAYOUT = [
  { id: NODE_IDS.ARRIVAL, position: 'top' },
  { id: NODE_IDS.LEGAL_RIGHTS, position: 'left' },
  { id: NODE_IDS.RESIDENCE_PERMIT, position: 'right' },
  { id: NODE_IDS.WORK_CAREER, position: 'bottom' },
]

export const FLOWS = {
  [NODE_IDS.ARRIVAL]: {
    totalSteps: 4,
    steps: [
      {
        id: 'arrival-status',
        type: 'radio',
        questionKey: 'intake.arrival.step1.question',
        options: [
          { value: 'recent', labelKey: 'intake.arrival.step1.recent' },
          { value: 'planning', labelKey: 'intake.arrival.step1.planning' },
          { value: 'relocating', labelKey: 'intake.arrival.step1.relocating' },
        ],
        answerKey: 'arrivalStatus',
      },
      {
        id: 'arrival-docs',
        type: 'checkbox',
        questionKey: 'intake.arrival.step2.question',
        options: [
          { value: 'passport', labelKey: 'intake.documents.passport' },
          { value: 'registration', labelKey: 'intake.documents.registration' },
          { value: 'bank', labelKey: 'intake.documents.bank' },
        ],
        answerKey: 'documents',
      },
      {
        id: 'arrival-summary',
        type: 'summary',
        questionKey: 'intake.step3.title',
        descriptionKey: 'intake.step3.description',
      },
      {
        id: 'arrival-confirm',
        type: 'confirm',
        questionKey: 'intake.step4.title',
        descriptionKey: 'intake.step4.description',
      },
    ],
    requiredDocuments: ['passport', 'registration'],
    actions: [
      { id: 'book-appointment', icon: 'Calendar', labelKey: 'actions.bookAppointment' },
      { id: 'view-forms', icon: 'FileText', labelKey: 'actions.viewForms' },
      { id: 'find-office', icon: 'MapPin', labelKey: 'actions.findOffice' },
      { id: 'call-hotline', icon: 'Phone', labelKey: 'actions.callHotline' },
    ],
  },
  [NODE_IDS.RESIDENCE_PERMIT]: {
    totalSteps: 4,
    steps: [
      {
        id: 'visa-status',
        type: 'radio',
        questionKey: 'intake.residence.step1.question',
        options: [
          { value: 'tourist', labelKey: 'intake.residence.step1.tourist' },
          { value: 'student', labelKey: 'intake.residence.step1.student' },
          { value: 'work', labelKey: 'intake.residence.step1.work' },
          { value: 'asylum', labelKey: 'intake.residence.step1.asylum' },
        ],
        answerKey: 'visaStatus',
      },
      {
        id: 'documents-held',
        type: 'checkbox',
        questionKey: 'intake.residence.step2.question',
        options: [
          { value: 'passport', labelKey: 'intake.documents.passport' },
          { value: 'photos', labelKey: 'intake.documents.photos' },
          { value: 'insurance', labelKey: 'intake.documents.insurance' },
        ],
        answerKey: 'documents',
      },
      {
        id: 'residence-summary',
        type: 'summary',
        questionKey: 'intake.step3.title',
        descriptionKey: 'intake.residence.step3.description',
      },
      {
        id: 'residence-confirm',
        type: 'confirm',
        questionKey: 'intake.step4.title',
        descriptionKey: 'intake.residence.step4.description',
      },
    ],
    requiredDocuments: ['passport', 'photos', 'insurance'],
    actions: [
      { id: 'book-appointment', icon: 'Calendar', labelKey: 'actions.bookAppointment' },
      { id: 'view-forms', icon: 'FileText', labelKey: 'actions.viewForms' },
      { id: 'find-office', icon: 'MapPin', labelKey: 'actions.findOffice' },
      { id: 'call-hotline', icon: 'Phone', labelKey: 'actions.callHotline' },
    ],
  },
  [NODE_IDS.LEGAL_RIGHTS]: {
    totalSteps: 4,
    steps: [],
    requiredDocuments: [],
    actions: [],
  },
  [NODE_IDS.WORK_CAREER]: {
    totalSteps: 4,
    steps: [],
    requiredDocuments: [],
    actions: [],
  },
}

export const DOCUMENT_LABEL_KEYS = {
  passport: 'intake.documents.passport',
  photos: 'intake.documents.photos',
  insurance: 'intake.documents.insurance',
  registration: 'intake.documents.registration',
  bank: 'intake.documents.bank',
}

export function getFlowForNode(nodeId) {
  return FLOWS[nodeId] ?? null
}
