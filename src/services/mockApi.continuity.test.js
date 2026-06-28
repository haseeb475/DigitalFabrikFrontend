// Feature: guided-navigator-revamp, Property 14: Intent continuity across follow-ups
import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'

import { apiService } from './mockApi.js'
import { detectIntent } from '../data/assistantMock.js'

// NOTE ON SPEED: every `apiService` method awaits a real, setTimeout-backed
// `delay()` (~600ms for `submitAssistantPrompt`). Rather than stubbing timers,
// we exercise the genuine code path and simply keep the iteration count low
// (`numRuns: 20`) with a generous per-test timeout. Follow-up arrays are capped
// short so each run stays well within budget.

// The mock API requires a persisted guest session in localStorage.
beforeEach(async () => {
  localStorage.clear()
  await apiService.initializeGuestSession()
})

// The finite set of defined topic Intents (excludes the `general` fallback).
const DEFINED_INTENTS = ['residence', 'anmeldung', 'work']

// A follow-up prompt generator that mixes:
// - phrases that fall back to the `general` Intent,
// - phrases that clearly map to each defined Intent (so re-detection sometimes
//   returns the established Intent and sometimes a differing one), and
// - arbitrary fuzz strings.
// The test never trusts these labels: it derives the expected detection from
// `detectIntent` itself, so the generator only needs to exercise the branches.
const followUpText = fc.oneof(
  fc.constantFrom(
    'what do i need',
    'tell me more',
    'thanks a lot',
    'okay next please',
    'more info',
    'can you explain that',
  ),
  fc.constantFrom('residence permit renewal', 'i need a visa', 'aufenthalt titel question'),
  fc.constantFrom('anmeldung register my address', 'melde appointment'),
  fc.constantFrom('work and job questions', 'blue card arbeit', 'employment contract'),
  fc.string(),
)

describe('mockApi follow-up intent continuity', () => {
  // Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
  it('keeps the established intent across follow-ups, replacing it only on a differing defined intent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...DEFINED_INTENTS),
        fc.array(followUpText, { minLength: 1, maxLength: 3 }),
        async (initialIntent, followUps) => {
          // Isolate each run: fresh storage + guest session so sessions never
          // leak across iterations.
          localStorage.clear()
          await apiService.initializeGuestSession()

          // Establish the session intent explicitly (e.g. from a goal tile).
          const start = await apiService.submitAssistantPrompt({
            prompt: 'I have a general question',
            intent: initialIntent,
          })
          const sessionId = start.session.id
          expect(start.session.intent).toBe(initialIntent)

          // Track the expected established intent independently, applying the
          // continuity rule: a `general` re-detection or a re-detection equal
          // to the established intent leaves it unchanged (Req 7.1, 7.2, 7.4);
          // a differing defined intent replaces it (Req 7.3, 7.5).
          let expectedIntent = initialIntent
          for (const text of followUps) {
            const detected = detectIntent(text)
            if (detected !== 'general' && detected !== expectedIntent) {
              expectedIntent = detected
            }

            const result = await apiService.submitAssistantPrompt({ prompt: text, sessionId })

            // The follow-up Card_Group is generated using the resolved intent
            // (Req 7.1, 7.2, 7.3)...
            expect(result.response.meta.intent).toBe(expectedIntent)
            // ...and the session stores that same intent (Req 7.4, 7.5).
            expect(result.session.intent).toBe(expectedIntent)
          }

          // The established intent persists through the Mock_API exactly as
          // tracked across the whole follow-up sequence (Req 7.4).
          const progress = await apiService.fetchUserProgress()
          const stored = progress.assistant.sessions.find((s) => s.id === sessionId)
          expect(stored.intent).toBe(expectedIntent)
        },
      ),
      { numRuns: 20 },
    )
  }, 90000)
})
