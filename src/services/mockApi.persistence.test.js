// Feature: guided-navigator-revamp, Property 18: Session persistence round-trip and migration preservation
import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { apiService } from './mockApi'

// `STORAGE_KEY`/`STORAGE_VERSION`, `readStorage`/`writeStorage`, and
// `migrateSession` are intentionally NOT exported from mockApi.js. We therefore
// drive the round-trip and migration through the public `apiService` surface
// plus the test-env `localStorage` stub (provided by src/test/setup.js):
//   - "persist" by writing the canonical serialized form into localStorage
//     under STORAGE_KEY (exactly what the private `writeStorage` does), and
//   - "read back" via `apiService.fetchUserProgress()` which reads, migrates,
//     re-persists, and returns the session.
const STORAGE_KEY = 'migrant_assistant_guest'
const CURRENT_VERSION = 5

const INTENTS = ['residence', 'anmeldung', 'work', 'general']
const NODE_IDS = ['arrival', 'residence-permit', 'legal-rights', 'work-career']

// JSON-safe building blocks. fast-check values are restricted to types that
// survive a JSON.stringify/JSON.parse round-trip (the actual persistence
// mechanism), so structural equality is meaningful.
const isoDate = fc
  .integer({ min: 0, max: 4102444800000 })
  .map((ms) => new Date(ms).toISOString())

const jsonScalar = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
)

const answersArb = fc.dictionary(fc.string({ minLength: 1, maxLength: 8 }), jsonScalar, {
  maxKeys: 4,
})

const cardArb = fc.record({
  id: fc.uuid(),
  title: fc.string(),
  category: fc.constantFrom('documents', 'office', 'process', 'timeline', 'sources', 'other'),
  classification: fc.constantFrom('actionable', 'advisable'),
})

const cardGroupArb = fc.record({
  id: fc.uuid(),
  prompt: fc.string(),
  cards: fc.array(cardArb, { maxLength: 3 }),
  createdAt: isoDate,
})

const followUpArb = fc.record({ id: fc.uuid(), text: fc.string(), createdAt: isoDate })

const walletItemArb = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('card', 'session'),
  savedAt: isoDate,
  title: fc.string(),
})

const helpFlowArb = fc.record({
  phase: fc.constantFrom('choose', 'interview', 'results', 'complete'),
  currentStep: fc.nat({ max: 10 }),
  answers: answersArb,
  completed: fc.boolean(),
})

const nodeArb = fc.record({ status: fc.constantFrom('locked', 'active', 'completed') })
const nodesArb = fc.record({
  arrival: nodeArb,
  'residence-permit': nodeArb,
  'legal-rights': nodeArb,
  'work-career': nodeArb,
})

// A fully-formed CURRENT (v5) assistant session: already carries `intent` and
// `cardCompletion`, so migration is a no-op and the round-trip is exact.
const assistantSessionV5Arb = fc.record({
  id: fc.uuid(),
  title: fc.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
  originalPrompt: fc.string(),
  followUpPrompts: fc.array(followUpArb, { maxLength: 2 }),
  cardGroups: fc.array(cardGroupArb, { maxLength: 3 }),
  guidedAnswers: answersArb,
  guidedState: fc.constant(null),
  status: fc.constantFrom('idle', 'completed', 'needs_more_info'),
  intent: fc.oneof(fc.constant(null), fc.constantFrom(...INTENTS)),
  cardCompletion: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.boolean(), {
    maxKeys: 3,
  }),
})

const validSessionArb = fc.record({
  schemaVersion: fc.constant(CURRENT_VERSION),
  sessionId: fc.uuid(),
  mode: fc.constant('guest'),
  locale: fc.constantFrom('de', 'en'),
  activeNodeId: fc.oneof(fc.constant(null), fc.constantFrom(...NODE_IDS)),
  helpFlow: helpFlowArb,
  assistant: fc.record({
    activeSessionId: fc.oneof(fc.constant(null), fc.uuid()),
    sessions: fc.array(assistantSessionV5Arb, { maxLength: 3 }),
    wallet: fc.array(walletItemArb, { maxLength: 3 }),
  }),
  nodes: nodesArb,
  createdAt: isoDate,
})

// A well-formed PRIOR-version (v3/v4) assistant session. `intent` and
// `cardCompletion` are optional (sometimes present, sometimes absent) so we
// exercise both the back-fill path and the preserve-existing path.
const assistantSessionPriorArb = fc.record(
  {
    id: fc.uuid(),
    title: fc.string(),
    createdAt: isoDate,
    updatedAt: isoDate,
    originalPrompt: fc.string(),
    followUpPrompts: fc.array(followUpArb, { maxLength: 2 }),
    cardGroups: fc.array(cardGroupArb, { maxLength: 3 }),
    guidedAnswers: answersArb,
    guidedState: fc.constant(null),
    status: fc.constantFrom('idle', 'completed', 'needs_more_info'),
    intent: fc.constantFrom(...INTENTS),
    cardCompletion: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.boolean(), {
      maxKeys: 3,
    }),
  },
  {
    requiredKeys: [
      'id',
      'title',
      'createdAt',
      'updatedAt',
      'originalPrompt',
      'followUpPrompts',
      'cardGroups',
      'guidedAnswers',
      'guidedState',
      'status',
    ],
  },
)

// Well-formed older session: has all the core structure (helpFlow, nodes,
// assistant with sessions/wallet arrays) so the ONLY migration changes are the
// v5 back-fills and the schemaVersion bump.
const priorSessionArb = fc.record({
  schemaVersion: fc.constantFrom(3, 4),
  sessionId: fc.uuid(),
  mode: fc.constant('guest'),
  locale: fc.constantFrom('de', 'en'),
  activeNodeId: fc.oneof(fc.constant(null), fc.constantFrom(...NODE_IDS)),
  helpFlow: helpFlowArb,
  assistant: fc.record({
    activeSessionId: fc.oneof(fc.constant(null), fc.uuid()),
    sessions: fc.array(assistantSessionPriorArb, { maxLength: 3 }),
    wallet: fc.array(walletItemArb, { maxLength: 3 }),
  }),
  nodes: nodesArb,
  createdAt: isoDate,
})

// Mirror of the production v5 migration applied to a JSON-clone of the original,
// so we can assert the migrated result equals "the original with only the v5
// back-fills applied" — i.e. nothing else was lost or altered.
function expectedMigration(original) {
  const expected = JSON.parse(JSON.stringify(original))
  for (const session of expected.assistant.sessions) {
    if (!session || typeof session !== 'object') continue
    session.intent = session.intent ?? null
    session.cardCompletion = session.cardCompletion ?? {}
  }
  expected.schemaVersion = CURRENT_VERSION
  return expected
}

function seed(session) {
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

describe('Property 18: Session persistence round-trip and migration preservation', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  // Validates: Requirements 10.4
  it('round-trips any valid session: persist then read back yields a deeply equal session', async () => {
    await fc.assert(
      fc.asyncProperty(validSessionArb, async (session) => {
        // Clear between iterations to avoid cross-contamination.
        globalThis.localStorage.clear()

        // Persist the complete session (canonical serialized form).
        seed(session)

        // Read it back through the public API (read -> migrate -> persist -> return).
        const readBack = await apiService.fetchUserProgress()

        // A valid current-version session survives the round-trip unchanged.
        expect(readBack).toEqual(session)

        // The Mock_API persisted the complete session back to storage (Req 10.4).
        const persisted = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY))
        expect(persisted).toEqual(session)
      }),
      { numRuns: 100 },
    )
  }, 60000)

  // Validates: Requirements 10.4
  it('migrateSession preserves all prior-version data while back-filling intent/cardCompletion and bumping schemaVersion', async () => {
    await fc.assert(
      fc.asyncProperty(priorSessionArb, async (session) => {
        globalThis.localStorage.clear()
        seed(session)

        const migrated = await apiService.fetchUserProgress()

        // Whole-session check: equals the original with ONLY the v5 back-fills
        // applied — proving every other field (sessionId, locale, createdAt,
        // nodes, helpFlow, wallet, cardGroups, guidedAnswers) is preserved.
        expect(migrated).toEqual(expectedMigration(session))

        // Schema version advanced to current.
        expect(migrated.schemaVersion).toBe(CURRENT_VERSION)

        // Explicit preservation of existing top-level data.
        expect(migrated.sessionId).toBe(session.sessionId)
        expect(migrated.locale).toBe(session.locale)
        expect(migrated.createdAt).toBe(session.createdAt)
        expect(migrated.nodes).toEqual(session.nodes)
        expect(migrated.helpFlow).toEqual(session.helpFlow)
        expect(migrated.assistant.wallet).toEqual(session.assistant.wallet)

        // Per-assistant-session: existing data preserved, new fields back-filled.
        migrated.assistant.sessions.forEach((migratedSession, index) => {
          const original = session.assistant.sessions[index]
          expect(migratedSession.id).toBe(original.id)
          expect(migratedSession.cardGroups).toEqual(original.cardGroups)
          expect(migratedSession.guidedAnswers).toEqual(original.guidedAnswers)

          // intent: preserved when present, defaulted to null when absent.
          if ('intent' in original) {
            expect(migratedSession.intent).toBe(original.intent)
          } else {
            expect(migratedSession.intent).toBeNull()
          }

          // cardCompletion: preserved when present, defaulted to {} when absent.
          if ('cardCompletion' in original) {
            expect(migratedSession.cardCompletion).toEqual(original.cardCompletion)
          } else {
            expect(migratedSession.cardCompletion).toEqual({})
          }
        })

        // The migrated session is re-persisted as the complete updated session.
        const persisted = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY))
        expect(persisted).toEqual(migrated)
      }),
      { numRuns: 100 },
    )
  }, 60000)
})
