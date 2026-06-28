// Feature: guided-navigator-revamp, Property 1: detectIntent is total and falls back to general
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { detectIntent, simulateAssistantResponse } from './assistantMock'

const DEFINED_INTENTS = ['residence', 'anmeldung', 'work', 'general']

// Mirror of the keyword regexes used by detectIntent in assistantMock.js.
// Re-declared here (they are not exported) so we can generate provably
// keyword-free strings for the general-fallback assertion.
const RESIDENCE = /residence|permit|aufenthalt|visa|immigration|ausländer|auslander|titel|renew/i
const ANMELDUNG = /anmeldung|register|address|melde/i
const WORK = /work|job|employment|arbeit|blue card/i

function isKeywordFree(text) {
  const t = text.trim().toLowerCase()
  return t.length >= 1 && !RESIDENCE.test(t) && !ANMELDUNG.test(t) && !WORK.test(t)
}

// Generate keyword-free strings from a safe alphabet (none of these characters
// can form any residence/anmeldung/work keyword), then filter as a safety net
// to guarantee the trimmed text is non-empty and matches no keyword regex.
const keywordFreeString = fc
  .array(fc.constantFrom(...'xyzqXYZQ0123456789 -_.'.split('')), {
    minLength: 1,
    maxLength: 200,
  })
  .map((chars) => chars.join(''))
  .filter(isKeywordFree)

describe('Property 1: detectIntent is total and falls back to general', () => {
  // Validates: Requirements 2.3, 2.4
  it('returns exactly one defined intent for any 1–1000 char string', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 1000 }), (input) => {
        const intent = detectIntent(input)
        expect(DEFINED_INTENTS).toContain(intent)
      }),
      { numRuns: 25 },
    )
  })

  it('classifies keyword-free strings as general and produces ≥1 starting-point card', () => {
    fc.assert(
      fc.property(keywordFreeString, (input) => {
        // Keyword-free input falls back to the general intent.
        expect(detectIntent(input)).toBe('general')

        // The public response path mirrors the fallback and surfaces
        // buildGeneralCards() output: at least one starting-point card.
        const response = simulateAssistantResponse({ prompt: input })
        expect(response.meta.intent).toBe('general')
        expect(response.status).toBe('completed')
        expect(Array.isArray(response.cards)).toBe(true)
        expect(response.cards.length).toBeGreaterThanOrEqual(1)
      }),
      { numRuns: 25 },
    )
  })
})
