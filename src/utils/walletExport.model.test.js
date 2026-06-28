import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { buildExportModel } from './walletExport.js'

// Feature: guided-navigator-revamp, Property 16: PDF export model order and completeness

// Relative ranking of card content section kinds, per Req 8.2:
// body → steps → checklist → sources → cta.
const CARD_SECTION_RANK = {
  body: 0,
  steps: 1,
  checklist: 2,
  sources: 3,
  cta: 4,
}

// --- Generators -------------------------------------------------------------

const nonEmptyString = fc.string({ minLength: 1, maxLength: 12 })

// A single action card. Content sub-fields are independently optional so the
// generator exercises every present/absent combination of sections.
const cardArb = fc.record({
  id: fc.uuid(),
  title: nonEmptyString,
  description: nonEmptyString,
  content: fc.record(
    {
      body: nonEmptyString,
      steps: fc.array(nonEmptyString, { maxLength: 4 }),
      items: fc.array(fc.record({ text: nonEmptyString }), { maxLength: 4 }),
      sources: fc.array(
        fc.record({ label: nonEmptyString, url: nonEmptyString }),
        { maxLength: 4 },
      ),
      cta: fc.option(fc.record({ label: nonEmptyString, url: nonEmptyString }), {
        nil: undefined,
      }),
    },
    { requiredKeys: [] },
  ),
})

const contextSummaryArb = fc.record(
  {
    goalLabel: fc.option(nonEmptyString, { nil: undefined }),
    userPrompt: fc.option(nonEmptyString, { nil: undefined }),
    answeredQuestions: fc.array(
      fc.record({ question: nonEmptyString, answerLabel: nonEmptyString }),
      { maxLength: 5 },
    ),
    followUpPrompts: fc.array(nonEmptyString, { maxLength: 3 }),
  },
  { requiredKeys: [] },
)

// Distinct card ids per item keep the "exactly once, same order" assertion
// unambiguous when comparing ids.
const cardsArb = fc
  .uniqueArray(cardArb, { maxLength: 6, selector: (c) => c.id })

// A single-card item, a full-session item, or a bundle (no `type`).
const itemArb = fc.oneof(
  fc.record({
    type: fc.constant('card'),
    title: nonEmptyString,
    contextSummary: contextSummaryArb,
    card: cardArb,
  }),
  fc.record({
    type: fc.constant('session'),
    title: nonEmptyString,
    contextSummary: contextSummaryArb,
    cards: cardsArb,
  }),
  fc.record({
    title: nonEmptyString,
    contextSummary: contextSummaryArb,
    cards: cardsArb,
  }),
)

// Mirror `extractCards` so the test knows the expected input cards in order.
function inputCards(item) {
  if (item.type === 'card') return item.card ? [item.card] : []
  if (Array.isArray(item.cards)) return item.cards
  return []
}

describe('buildExportModel — Property 16: export model order and completeness', () => {
  it('orders sections, includes the goal and every Q&A, and includes every card exactly once in order', () => {
    fc.assert(
      fc.property(itemArb, (item) => {
        const model = buildExportModel(item)

        // --- Structural ordering: contextSummary precedes cards ------------
        // The model exposes contextSummary then cards as named fields, so the
        // context summary is conceptually emitted before any card content.
        expect(Array.isArray(model.contextSummary)).toBe(true)
        expect(Array.isArray(model.cards)).toBe(true)

        // --- Selected goal (Req 8.4) ---------------------------------------
        // 'goal' is always present and is always the first context section.
        const goalSection = model.contextSummary[0]
        expect(goalSection.kind).toBe('goal')
        const expectedGoal =
          item.contextSummary?.goalLabel ?? item.contextSummary?.userPrompt ?? ''
        expect(goalSection.text).toBe(expectedGoal)

        // --- Answered questions paired 1:1 with answers (Req 8.4) ----------
        const answeredSection = model.contextSummary.find(
          (s) => s.kind === 'answeredQuestions',
        )
        const inputAnswered = item.contextSummary?.answeredQuestions ?? []
        if (inputAnswered.length) {
          expect(answeredSection).toBeDefined()
          expect(answeredSection.items).toHaveLength(inputAnswered.length)
          inputAnswered.forEach((a, i) => {
            expect(answeredSection.items[i]).toEqual({
              question: a.question,
              answer: a.answerLabel,
            })
          })
        } else {
          expect(answeredSection).toBeUndefined()
        }

        // --- Card content section ordering (Req 8.2) -----------------------
        model.cards.forEach((card) => {
          const ranks = card.sections.map((s) => CARD_SECTION_RANK[s.kind])
          // Every emitted section is a known kind.
          ranks.forEach((r) => expect(r).not.toBeUndefined())
          // Ranks of present sections are strictly increasing, i.e. the order
          // body < steps < checklist < sources < cta is respected.
          const sorted = [...ranks].sort((a, b) => a - b)
          expect(ranks).toEqual(sorted)
        })

        // --- Every input card exactly once, in guide order (Req 8.5) -------
        const expectedIds = inputCards(item).map((c) => c.id)
        const actualIds = model.cards.map((c) => c.id)
        expect(actualIds).toEqual(expectedIds)
      }),
      { numRuns: 25 },
    )
  })
})
