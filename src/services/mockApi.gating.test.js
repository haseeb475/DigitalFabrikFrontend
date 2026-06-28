// Feature: guided-navigator-revamp, Property 15: Clarifying-question gating
import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { apiService } from './mockApi'
import { simulateAssistantResponse } from '../data/assistantMock'

// Property 15 (Validates: Requirements 6.7, 13.1, 13.3):
// For any started session, when required situation details are missing the
// response status is `needs_more_info` with non-empty `guidedQuestions` and no
// cards, and existing `cardGroups` are left unchanged; when no required details
// are missing the response status is `completed` and a card group is produced.
//
// Only the `residence` intent gates with guided questions. Its required
// questions, in answer order, are permit_goal then permit_expiry, and (only
// when permit_goal === 'renew') city. Non-residence intents never gate.
//
// The gating decision lives in the pure `simulateAssistantResponse`, which has
// no artificial `delay()`. We exercise the property mostly against that pure
// function (fast), and use a single apiService-driven case to confirm the
// persisted `cardGroups` stays unchanged while a residence session is gating.

const goalArb = fc.constantFrom('first', 'renew', 'change')
const expiryArb = fc.constantFrom('expired', '30_days', '3_months', 'later')
const cityArb = fc.constantFrom('berlin', 'munich', 'hamburg', 'other')
const promptArb = fc.string({ minLength: 1, maxLength: 40 })

// Build a residence answers map up to (but not including) a given step, so we
// can assert that every prefix of the required answers still gates.
function residenceAnswers(goal, expiry, city) {
  return { permit_goal: goal, permit_expiry: expiry, city }
}

// The ordered list of required answer keys for a residence goal.
function requiredKeys(goal) {
  return goal === 'renew'
    ? ['permit_goal', 'permit_expiry', 'city']
    : ['permit_goal', 'permit_expiry']
}

describe('Property 15: Clarifying-question gating', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  // Validates: Requirements 6.7, 13.1, 13.3
  it('gates on missing residence details (needs_more_info, questions, no cards) and completes with a card group otherwise', () => {
    fc.assert(
      fc.property(
        fc.record({
          intent: fc.constantFrom('residence', 'anmeldung', 'work', 'general'),
          goal: goalArb,
          expiry: expiryArb,
          city: cityArb,
          prompt: promptArb,
        }),
        ({ intent, goal, expiry, city, prompt }) => {
          if (intent !== 'residence') {
            // Non-gating intents complete immediately with at least one card.
            const res = simulateAssistantResponse({ prompt, intent })
            expect(res.status).toBe('completed')
            expect(res.cards.length).toBeGreaterThan(0)
            return
          }

          const keys = requiredKeys(goal)
          const full = residenceAnswers(goal, expiry, city)

          // Every strict prefix of the required answers is missing a detail and
          // must gate: needs_more_info, non-empty questions, and no cards.
          for (let i = 0; i < keys.length; i += 1) {
            const partial = {}
            for (let j = 0; j < i; j += 1) partial[keys[j]] = full[keys[j]]

            const res = simulateAssistantResponse({
              prompt,
              intent,
              answers: partial,
            })
            expect(res.status).toBe('needs_more_info')
            expect(res.guidedQuestions.length).toBeGreaterThan(0)
            expect(res.cards).toEqual([])
          }

          // With every required detail supplied, the session completes and a
          // card group's worth of cards is produced.
          const answers = {}
          for (const k of keys) answers[k] = full[k]
          const done = simulateAssistantResponse({ prompt, intent, answers })
          expect(done.status).toBe('completed')
          expect(done.cards.length).toBeGreaterThan(0)
          expect(done.guidedQuestions).toBeNull()
        },
      ),
      { numRuns: 20 },
    )
  }, 30000)

  // Validates: Requirements 6.7, 13.1 — the persisted layer must not append a
  // card group while a residence session is gating on missing details.
  it('leaves persisted cardGroups unchanged while a residence session gates (apiService path)', async () => {
    await fc.assert(
      fc.asyncProperty(promptArb, async (prompt) => {
        globalThis.localStorage.clear()
        await apiService.initializeGuestSession()

        const { session, response } = await apiService.submitAssistantPrompt({
          prompt,
          intent: 'residence',
        })

        // Gating response surfaced and no card group was persisted.
        expect(response.status).toBe('needs_more_info')
        expect(response.guidedQuestions.length).toBeGreaterThan(0)
        expect(response.cards).toEqual([])
        expect(session.cardGroups).toEqual([])
        expect(session.status).toBe('needs_more_info')
      }),
      { numRuns: 20 },
    )
  }, 30000)
})
