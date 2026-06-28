import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { apiService } from './mockApi'

// Deep clone helper so captured snapshots are not affected by the live
// session object being mutated on subsequent submissions.
const snapshot = (value) => JSON.parse(JSON.stringify(value))

// A non-residence intent always yields a `completed` response that appends a
// new card group (residence without all guided answers returns
// `needs_more_info` and appends nothing).
const COMPLETED_INTENT = 'anmeldung'

const isNonDecreasingByCreatedAt = (groups) => {
  for (let i = 1; i < groups.length; i += 1) {
    if (String(groups[i - 1].createdAt) > String(groups[i].createdAt)) {
      return false
    }
  }
  return true
}

describe('mockApi cardGroups are append-only and order-preserving', () => {
  beforeEach(async () => {
    localStorage.clear()
    await apiService.initializeGuestSession()
  })

  // Feature: guided-navigator-revamp, Property 13: Card groups are append-only and order-preserving
  // Validates: Requirements 6.1, 6.2, 6.4
  it(
    'appends exactly one new group per completed submission, leaving prior groups unchanged and ordered by createdAt',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 80 }),
          fc.array(fc.string({ minLength: 1, maxLength: 80 }), {
            minLength: 1,
            maxLength: 3,
          }),
          async (startPrompt, followUps) => {
            // Fresh state for every iteration.
            localStorage.clear()
            await apiService.initializeGuestSession()

            // Start the session with a completed-yielding intent.
            const { session: started } = await apiService.submitAssistantPrompt({
              prompt: startPrompt,
              intent: COMPLETED_INTENT,
            })
            const sessionId = started.id

            // First submission must have produced exactly one card group.
            expect(started.cardGroups).toHaveLength(1)
            let prev = snapshot(started.cardGroups)
            expect(isNonDecreasingByCreatedAt(prev)).toBe(true)

            // Each follow-up that completes must append exactly one new group.
            for (const text of followUps) {
              const { session: updated } = await apiService.submitAssistantPrompt({
                prompt: text,
                sessionId,
                intent: COMPLETED_INTENT,
              })
              const next = snapshot(updated.cardGroups)

              // Length increased by exactly one.
              expect(next).toHaveLength(prev.length + 1)

              // Prior entries unchanged in content, order, and count: the new
              // array equals the previous array followed by exactly one new
              // group (the new group is the last entry).
              expect(next.slice(0, prev.length)).toEqual(prev)

              // Render order ascends by createdAt (oldest -> newest).
              expect(isNonDecreasingByCreatedAt(next)).toBe(true)

              prev = next
            }
          },
        ),
        // `submitAssistantPrompt` has real ~600ms `delay()` calls, so the
        // iteration count is kept low and the per-test timeout is generous.
        { numRuns: 20 },
      )
    },
    30000,
  )
})
