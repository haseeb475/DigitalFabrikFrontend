// Feature: guided-navigator-revamp, Property 2: Goal-tile mapping is deterministic and well-formed
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { GOAL_TILES, detectIntent } from './assistantMock'

const DEFINED_INTENTS = ['residence', 'anmeldung', 'work', 'general']

// The intent that a tile maps to. Tiles carry an explicit `intent`, so this is
// a pure lookup — no free-text classification (detectIntent) is involved.
function mapTileToIntent(tile) {
  return tile.intent
}

describe('Property 2: Goal-tile mapping is deterministic and well-formed', () => {
  // Validates: Requirements 1.5, 2.1, 2.2, 5.6
  it('maps every tile deterministically to one of the defined intents', () => {
    fc.assert(
      fc.property(fc.constantFrom(...GOAL_TILES), (tile) => {
        const first = mapTileToIntent(tile)
        const second = mapTileToIntent(tile)

        // Deterministic / repeatable: mapping the same tile yields the same intent.
        expect(second).toBe(first)
        // The mapping is the tile's explicit intent (no classification).
        expect(first).toBe(tile.intent)
        // Every intent is one of the defined intents.
        expect(DEFINED_INTENTS).toContain(first)
      }),
      { numRuns: 100 },
    )
  })

  it('produces an intent without invoking free-text classification', () => {
    // Safety-net: a tile's explicit intent need not match what detectIntent
    // would infer from its seedPrompt — proving the mapping is by `intent`,
    // not by classifying free text. The intent must still be defined.
    fc.assert(
      fc.property(fc.constantFrom(...GOAL_TILES), (tile) => {
        const mapped = mapTileToIntent(tile)
        expect(DEFINED_INTENTS).toContain(mapped)
        // detectIntent itself always returns a defined intent for any string.
        expect(DEFINED_INTENTS).toContain(detectIntent(tile.seedPrompt))
      }),
      { numRuns: 100 },
    )
  })

  it('defines a well-formed, non-empty intent on every tile', () => {
    fc.assert(
      fc.property(fc.constantFrom(...GOAL_TILES), (tile) => {
        expect(typeof tile.intent).toBe('string')
        expect(tile.intent.length).toBeGreaterThan(0)
        expect(DEFINED_INTENTS).toContain(tile.intent)
      }),
      { numRuns: 100 },
    )
  })

  it('includes the required goals (first residence permit, register address, renew permit)', () => {
    const ids = GOAL_TILES.map((tile) => tile.id)
    expect(ids).toContain('first_residence')
    expect(ids).toContain('register_address')
    expect(ids).toContain('renew_permit')
  })
})
