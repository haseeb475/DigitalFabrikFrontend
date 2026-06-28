/**
 * Simulates backend assistant API responses.
 * Replace `simulateAssistantResponse` with a real HTTP call — keep this shape.
 */

const RESIDENCE = /residence|permit|aufenthalt|visa|immigration|ausländer|auslander|titel|renew/i
const ANMELDUNG = /anmeldung|register|address|melde/i
const WORK = /work|job|employment|arbeit|blue card/i

export function detectIntent(prompt) {
  const text = prompt.trim().toLowerCase()
  if (RESIDENCE.test(text)) return 'residence'
  if (ANMELDUNG.test(text)) return 'anmeldung'
  if (WORK.test(text)) return 'work'
  return 'general'
}

const QUESTION_CATALOG = {
  residence: [
    {
      id: 'permit_goal',
      type: 'radio',
      question: 'What do you need help with?',
      required: true,
      options: [
        { value: 'first', label: 'Apply for my first residence permit' },
        { value: 'renew', label: 'Renew an existing permit' },
        { value: 'change', label: 'Change status (e.g. student → work)' },
      ],
    },
    {
      id: 'permit_expiry',
      type: 'radio',
      question: 'When does your current permit or visa expire?',
      required: true,
      options: [
        { value: 'expired', label: 'Already expired' },
        { value: '30_days', label: 'Within 30 days' },
        { value: '3_months', label: 'Within 3 months' },
        { value: 'later', label: 'More than 3 months away / not sure' },
      ],
    },
    {
      id: 'city',
      type: 'select',
      question: 'Which city is your Ausländerbehörde in?',
      required: true,
      options: [
        { value: 'berlin', label: 'Berlin' },
        { value: 'munich', label: 'Munich' },
        { value: 'hamburg', label: 'Hamburg' },
        { value: 'other', label: 'Other city' },
      ],
    },
  ],
}

function pendingQuestions(intent, answers) {
  if (intent !== 'residence') return []

  const pending = []
  if (!answers.permit_goal) pending.push(QUESTION_CATALOG.residence[0])
  else if (!answers.permit_expiry) pending.push(QUESTION_CATALOG.residence[1])
  else if (answers.permit_goal === 'renew' && !answers.city) {
    pending.push(QUESTION_CATALOG.residence[2])
  }
  return pending
}

function resolveAnsweredQuestions(intent, answers) {
  const catalog = QUESTION_CATALOG[intent] ?? []
  return catalog
    .filter((q) => answers[q.id])
    .map((q) => {
      const option = q.options?.find((o) => o.value === answers[q.id])
      return {
        questionId: q.id,
        question: q.question,
        answerValue: answers[q.id],
        answerLabel: option?.label ?? answers[q.id],
      }
    })
}

function buildContextSummary({ prompt, intent, answers, followUpPrompts = [] }) {
  return {
    userPrompt: prompt,
    intent,
    answeredQuestions: resolveAnsweredQuestions(intent, answers),
    followUpPrompts: followUpPrompts.map((f) =>
      typeof f === 'string' ? f : f.text,
    ),
  }
}

function buildWalletBundle({ prompt, intent, answers, followUpPrompts, cards }) {
  const contextSummary = buildContextSummary({
    prompt,
    intent,
    answers,
    followUpPrompts,
  })

  return {
    bundleId: crypto.randomUUID(),
    title: prompt.slice(0, 100),
    generatedAt: new Date().toISOString(),
    contextSummary,
    cards,
  }
}

/**
 * Fixed category ranking for action cards. Lower rank renders first.
 * documents < office < process < timeline < sources < other
 */
const CATEGORY_RANK = {
  documents: 0,
  office: 1,
  process: 2,
  timeline: 3,
  sources: 4,
  other: 5,
}

/**
 * Pure helper: returns a permutation of `cards` sorted by the fixed category
 * rank. Absent categories are naturally omitted (nothing is injected), the
 * relative order within an equal rank is preserved (stable), and no card is
 * ever dropped. Cards with an unknown/missing category sort with `other`.
 *
 * @param {Array<{ category?: string }>} cards
 * @returns {Array<object>}
 */
export function orderActionCards(cards) {
  const list = Array.isArray(cards) ? cards : []
  const rankOf = (card) => {
    const rank = CATEGORY_RANK[card?.category]
    return rank === undefined ? CATEGORY_RANK.other : rank
  }
  return list
    .map((card, index) => ({ card, index }))
    .sort((a, b) => {
      const diff = rankOf(a.card) - rankOf(b.card)
      // Preserve original relative order within equal ranks (stable sort).
      return diff !== 0 ? diff : a.index - b.index
    })
    .map((entry) => entry.card)
}

/**
 * Builds the `OfficeCardContent` for the `office` action card. The office type
 * is derived from the intent (residence → Ausländerbehörde, anmeldung →
 * Bürgeramt, otherwise null). Booking and what-to-bring sections are always
 * present, even when the office type is unknown. `bookingPortal.cityText`
 * embeds the exact `answers.city` value when provided, and is null otherwise.
 *
 * @param {'residence'|'anmeldung'|string} intent
 * @param {{ city?: string }} [answers]
 */
function buildOfficeCardContent(intent, answers = {}) {
  const officeType =
    intent === 'residence'
      ? 'Ausländerbehörde'
      : intent === 'anmeldung'
        ? 'Bürgeramt'
        : null

  const city = answers.city

  const isBurgeramt = officeType === 'Bürgeramt'

  return {
    officeType,
    officeFallback: officeType
      ? null
      : 'We could not match a specific office for this topic. Use your city or municipality service portal to find the responsible office.',
    bookingPortal: {
      name: isBurgeramt
        ? 'Bürgeramt / Bürgerservice appointment portal'
        : officeType
          ? 'Ausländerbehörde online appointment portal'
          : 'Local city service portal',
      steps: isBurgeramt
        ? [
            'Open your city Bürgeramt / Bürgerservice website',
            'Select "Termin vereinbaren" (book an appointment)',
            'Choose "Anmeldung einer Wohnung" as the service',
            'Pick an available date and confirm with your details',
          ]
        : [
            'Open your city Ausländerbehörde website',
            'Go to the online appointment (Termin) section',
            'Choose your service category (e.g. residence permit)',
            'Pick an available slot and confirm with your passport details',
          ],
      cityText: city
        ? `Booking for ${city}: open the ${city} portal and filter by your district.`
        : null,
    },
    whatToBring: isBurgeramt
      ? [
          'Valid passport or national ID',
          'Rental contract (Mietvertrag)',
          'Wohnungsgeberbestätigung from your landlord',
          'Completed registration form (Anmeldeformular)',
        ]
      : [
          'Valid passport',
          'Biometric photos',
          'Proof of health insurance',
          'Completed application form',
        ],
    sources: isBurgeramt
      ? [{ label: 'Bürgeramt — Anmeldung', url: '#' }]
      : [{ label: 'Ausländerbehörde — appointments', url: 'https://www.bamf.de' }],
  }
}

function buildResidenceCards(answers) {
  const urgent = answers.permit_expiry === 'expired' || answers.permit_expiry === '30_days'

  return [
    {
      id: 'documents',
      title: 'Required documents',
      description: 'Everything to bring to your appointment — originals and copies.',
      icon: 'FileText',
      status: 'ready',
      category: 'documents',
      classification: 'actionable',
      content: {
        body: 'Missing documents are the main reason for rescheduled appointments. Prepare these before you go.',
        items: [
          { text: 'Valid passport', status: 'ready' },
          { text: 'Biometric photos', status: 'ready' },
          { text: 'Health insurance proof', status: 'info' },
          { text: 'Employment contract or enrollment letter', status: 'info' },
          { text: 'Rental contract / Wohnungsgeberbestätigung', status: 'info' },
          { text: 'Current Aufenthaltstitel (if renewing)', status: 'ready' },
        ],
        cta: { label: 'See document examples', url: '#' },
        sources: [{ label: 'Ausländerbehörde document list', url: '#' }],
      },
    },
    {
      id: 'process',
      title: 'Application process',
      description: 'Step-by-step from booking to receiving your permit.',
      icon: 'ListChecks',
      status: 'ready',
      category: 'process',
      classification: 'actionable',
      content: {
        steps: [
          'Book an appointment at your local Ausländerbehörde',
          'Gather all required documents',
          'Attend appointment and submit your application',
          'Receive Fiktionsbescheinigung if processing continues',
          'Collect your Aufenthaltstitel when ready',
        ],
        sources: [{ label: 'Service Berlin — Aufenthaltstitel', url: '#' }],
      },
    },
    {
      id: 'appointment',
      title: 'Book appointment',
      description: 'City-specific portals — book early, slots fill fast.',
      icon: 'Calendar',
      status: urgent ? 'recommended' : 'ready',
      category: 'office',
      classification: 'actionable',
      content: buildOfficeCardContent('residence', answers),
    },
    {
      id: 'timeline',
      title: 'Timeline & expiry',
      description: urgent
        ? 'Act soon — your permit window is critical.'
        : 'Typical processing times by stage.',
      icon: 'Clock',
      status: urgent ? 'recommended' : 'ready',
      category: 'timeline',
      classification: 'actionable',
      content: {
        body:
          answers.permit_expiry === 'expired'
            ? 'If your permit expired, contact the Ausländerbehörde immediately. You may receive a Fiktionsbescheinigung while waiting.'
            : 'Processing usually takes 4–12 weeks depending on city workload.',
        steps: [
          'Week 1–2: Book appointment & gather documents',
          'Week 3–4: Attend appointment',
          'Week 4–12: Processing period',
          'Final: Collect permit card',
        ],
      },
    },
  ]
}

function buildAnmeldungCards(answers = {}) {
  return [
    {
      id: 'documents',
      title: 'Documents for Anmeldung',
      description: 'Passport, rental contract, and landlord confirmation.',
      icon: 'FileText',
      status: 'ready',
      category: 'documents',
      classification: 'actionable',
      content: {
        items: [
          { text: 'Valid passport or ID', status: 'ready' },
          { text: 'Rental contract (Mietvertrag)', status: 'ready' },
          { text: 'Wohnungsgeberbestätigung from landlord', status: 'info' },
        ],
        body: 'All persons registered at the address must appear in person (or with a Vollmacht).',
      },
    },
    {
      id: 'appointment',
      title: 'Book your Bürgeramt appointment',
      description: 'Register your address at the Bürgeramt — book early.',
      icon: 'Calendar',
      status: 'recommended',
      category: 'office',
      classification: 'actionable',
      content: buildOfficeCardContent('anmeldung', answers),
    },
    {
      id: 'deadline',
      title: '14-day deadline',
      description: 'Register within two weeks of moving in.',
      icon: 'Clock',
      status: 'ready',
      category: 'timeline',
      classification: 'actionable',
      content: {
        body: 'Late registration can result in fines in some cities. Book your Bürgeramt appointment as soon as you have your rental contract.',
        items: [{ text: 'Fine possible if registration is late', status: 'warning' }],
      },
    },
  ]
}

function buildGeneralCards() {
  return [
    {
      id: 'explore',
      title: 'Explore common topics',
      description: 'Residence permits, Anmeldung, work, and insurance.',
      icon: 'Compass',
      status: 'recommended',
      category: 'other',
      classification: 'advisable',
      content: {
        body: 'Try asking about a specific topic for tailored action cards — e.g. "How do I renew my visa?"',
      },
    },
  ]
}

function buildWorkCards() {
  return [
    {
      id: 'work-eligibility',
      title: 'Can you work?',
      description: 'Whether your current permit or status allows employment.',
      icon: 'Briefcase',
      status: 'recommended',
      category: 'other',
      classification: 'advisable',
      content: {
        body: 'Your right to work depends on your residence title. Many permits include work authorization, but some restrict it to specific employers or hours.',
        items: [
          { text: 'Check the "Erwerbstätigkeit gestattet" note on your permit', status: 'ready' },
          { text: 'Student permits often allow limited working hours', status: 'info' },
          { text: 'A separate work approval may be needed for some titles', status: 'warning' },
        ],
        sources: [
          { label: 'Make it in Germany — Working', url: 'https://www.make-it-in-germany.com' },
          { label: 'BAMF — Employment', url: 'https://www.bamf.de' },
        ],
      },
    },
    {
      id: 'work-process',
      title: 'Getting work approval',
      description: 'Step-by-step from job offer to permission to work.',
      icon: 'ListChecks',
      status: 'ready',
      category: 'process',
      classification: 'actionable',
      content: {
        steps: [
          'Confirm whether your permit already allows employment',
          'Secure a job offer or employment contract',
          'Apply at the Ausländerbehörde if a work approval is required',
          'Wait for the Bundesagentur für Arbeit consent where applicable',
          'Start work once authorization is confirmed',
        ],
        sources: [{ label: 'Bundesagentur für Arbeit', url: '#' }],
      },
    },
  ]
}

/**
 * Derives an urgency indicator from situation signals. Urgency is conveyed by
 * both a text `label` and a `colorToken` so color is never the sole signal.
 *
 * @param {string} intent
 * @param {{ permit_expiry?: string }} [answers]
 */
function deriveUrgency(intent, answers = {}) {
  const expiry = answers.permit_expiry
  let level = 'none'
  let detail = null

  if (expiry === 'expired' || expiry === '30_days') {
    level = 'urgent'
    detail =
      expiry === 'expired'
        ? 'Your permit has already expired — contact the office immediately.'
        : 'Your permit expires within 30 days — act now.'
  } else if (expiry === '3_months') {
    level = 'soon'
    detail = 'Your permit expires within 3 months — start the process soon.'
  }

  // Anmeldung must happen within 14 days of moving in — treat as "soon" unless
  // a stronger permit-expiry signal already raised the level.
  if (intent === 'anmeldung' && level === 'none') {
    level = 'soon'
    detail = 'Anmeldung must be completed within 14 days of moving in.'
  }

  const LABELS = { urgent: 'Urgent', soon: 'Soon', none: 'No deadline' }
  const COLOR_TOKENS = {
    urgent: 'text-red-600',
    soon: 'text-amber-500',
    none: 'text-slate-400',
  }

  return {
    level,
    label: LABELS[level],
    detail,
    colorToken: COLOR_TOKENS[level],
  }
}

/**
 * Pure helper producing the `SummaryCardModel` rendered in the pinned summary
 * slot. Recaps the selected goal and answered questions, surfaces the single
 * most important next action (the first `actionable` card in canonical order),
 * and an urgency indicator. When neither a goal nor any answers are present,
 * `empty` is true and a "no information yet" message is carried in
 * `verdict.text`.
 *
 * @param {{ goalLabel?: string|null, intent?: string, answers?: Record<string,string>, cards?: Array<object> }} [params]
 * @returns {{ kind: 'summary', empty: boolean, goalLabel: string|null, answeredQuestions: Array<{question: string, answerLabel: string}>, verdict: { text: string, fromCardId: string|null }, urgency: { level: string, label: string, detail: string|null, colorToken: string } }}
 */
export function buildSummaryCard({
  goalLabel,
  intent,
  answers = {},
  cards = [],
} = {}) {
  const answeredQuestions = resolveAnsweredQuestions(intent, answers).map(
    (q) => ({
      question: q.question,
      answerLabel: q.answerLabel,
    }),
  )

  const hasGoal = Boolean(goalLabel)
  const empty = !hasGoal && answeredQuestions.length === 0

  const orderedCards = orderActionCards(cards)
  const topActionable = orderedCards.find(
    (card) => card?.classification === 'actionable',
  )

  // A compact overview of the whole guide — every step in canonical order.
  const steps = orderedCards.map((card) => ({
    id: card.id,
    title: card.title,
    classification: card.classification ?? 'advisable',
  }))

  let verdict
  if (empty) {
    verdict = {
      text: 'No situation information yet — pick a goal or answer a few questions to see your next step.',
      fromCardId: null,
    }
  } else if (topActionable) {
    verdict = {
      text: `Do this next: ${topActionable.title}`,
      fromCardId: topActionable.id,
    }
  } else {
    verdict = {
      text: 'Review your steps to decide the best next action.',
      fromCardId: null,
    }
  }

  return {
    kind: 'summary',
    empty,
    goalLabel: goalLabel ?? null,
    answeredQuestions,
    steps,
    verdict,
    urgency: deriveUrgency(intent, answers),
  }
}

/**
 * @param {{ prompt: string, intent?: 'residence'|'anmeldung'|'work'|'general', answers?: Record<string, string>, followUpPrompts?: Array<{text: string}>|string[] }} params
 */
export function simulateAssistantResponse({
  prompt,
  intent: intentOverride,
  answers = {},
  followUpPrompts = [],
}) {
  // Use the explicit intent override when provided (e.g. goal tiles or intent
  // continuity); otherwise fall back to free-text classification.
  const intent = intentOverride ?? detectIntent(prompt)
  const requestId = crypto.randomUUID()
  const generatedAt = new Date().toISOString()
  const contextSummary = buildContextSummary({
    prompt,
    intent,
    answers,
    followUpPrompts,
  })

  const meta = { requestId, generatedAt, intent, version: '1.0' }

  if (intent === 'residence') {
    const guidedQuestions = pendingQuestions(intent, answers)
    const hasUnanswered = guidedQuestions.length > 0

    if (hasUnanswered) {
      return {
        meta,
        status: 'needs_more_info',
        intro:
          'Before I build your action cards, I need a few details about your permit situation.',
        contextSummary,
        guidedQuestions,
        cards: [],
        walletBundle: null,
      }
    }

    const cards = buildResidenceCards(answers)
    return {
      meta,
      status: 'completed',
      intro: 'Here are your personalized action cards based on your answers:',
      contextSummary,
      guidedQuestions: null,
      cards,
      walletBundle: buildWalletBundle({
        prompt,
        intent,
        answers,
        followUpPrompts,
        cards,
      }),
    }
  }

  if (intent === 'anmeldung') {
    const cards = buildAnmeldungCards(answers)
    return {
      meta,
      status: 'completed',
      intro: 'Here are the key steps for Anmeldung:',
      contextSummary,
      guidedQuestions: null,
      cards,
      walletBundle: buildWalletBundle({
        prompt,
        intent,
        answers,
        followUpPrompts,
        cards,
      }),
    }
  }

  if (intent === 'work') {
    const cards = buildWorkCards()
    return {
      meta,
      status: 'completed',
      intro: 'Here is what you need to know about working in Germany:',
      contextSummary,
      guidedQuestions: null,
      cards,
      walletBundle: buildWalletBundle({
        prompt,
        intent,
        answers,
        followUpPrompts,
        cards,
      }),
    }
  }

  const cards = buildGeneralCards()
  return {
    meta,
    status: 'completed',
    intro: 'Here are some starting points:',
    contextSummary,
    guidedQuestions: null,
    cards,
    walletBundle: buildWalletBundle({
      prompt,
      intent,
      answers,
      followUpPrompts,
      cards,
    }),
  }
}

export const PROMPT_SUGGESTIONS = [
  { id: 'residence', label: 'How do I get a residence permit?' },
  { id: 'anmeldung', label: 'How do I register my address?' },
  { id: 'renewal', label: 'How do I renew my visa?' },
  { id: 'work', label: 'Can I work while my permit is processing?' },
]

/**
 * A predefined, tappable goal presented on the Landing page and the Navigator
 * entry view. Tiles carry an explicit `intent`, so activating one maps
 * deterministically to a topic without invoking free-text classification.
 *
 * Labels are locale keys (resolved through the i18n system at render time),
 * never stored literals. `icon` references a key in `ASSISTANT_ICON_MAP`
 * (see `assistantUtils.jsx`).
 *
 * @typedef {Object} GoalTileDef
 * @property {string} id - Stable key, e.g. 'first_residence'.
 * @property {'residence' | 'anmeldung' | 'work' | 'general'} intent - Deterministic intent.
 * @property {string} icon - An `ASSISTANT_ICON_MAP` key, e.g. 'FileText'.
 * @property {string} labelKey - Locale key for the tile label, e.g. 'goals.firstResidence.label'.
 * @property {string} descriptionKey - Locale key for the tile description.
 * @property {string} seedPrompt - Canonical prompt used to seed the session recap.
 */

/**
 * The Navigator goal tiles. Includes the required goals — first residence
 * permit, register address, and renew permit — and stays within the 3–8 tile
 * range required by the goal-first entry views.
 *
 * @type {GoalTileDef[]}
 */
export const GOAL_TILES = [
  {
    id: 'first_residence',
    intent: 'residence',
    icon: 'FileText',
    labelKey: 'goals.firstResidence.label',
    descriptionKey: 'goals.firstResidence.description',
    seedPrompt: 'How do I get my first residence permit?',
  },
  {
    id: 'register_address',
    intent: 'anmeldung',
    icon: 'Calendar',
    labelKey: 'goals.registerAddress.label',
    descriptionKey: 'goals.registerAddress.description',
    seedPrompt: 'How do I register my address (Anmeldung)?',
  },
  {
    id: 'renew_permit',
    intent: 'residence',
    icon: 'Clock',
    labelKey: 'goals.renewPermit.label',
    descriptionKey: 'goals.renewPermit.description',
    seedPrompt: 'How do I renew my residence permit?',
  },
  {
    id: 'work',
    intent: 'work',
    icon: 'Briefcase',
    labelKey: 'goals.work.label',
    descriptionKey: 'goals.work.description',
    seedPrompt: 'Can I work with my current permit?',
  },
  {
    id: 'change_status',
    intent: 'residence',
    icon: 'ListChecks',
    labelKey: 'goals.changeStatus.label',
    descriptionKey: 'goals.changeStatus.description',
    seedPrompt: 'How do I change my residence status?',
  },
  {
    id: 'something_else',
    intent: 'general',
    icon: 'Compass',
    labelKey: 'goals.somethingElse.label',
    descriptionKey: 'goals.somethingElse.description',
    seedPrompt: 'I need help with something else',
  },
]
