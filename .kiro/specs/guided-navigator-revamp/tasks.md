# Implementation Plan: Guided Navigator Revamp

## Overview

This plan converts the Guided Navigator Revamp design into incremental, dependency-ordered coding tasks. The work is an **in-place evolution** of the existing assistant workspace rather than a parallel feature (per design Decision 2): we extend `src/data/assistantMock.js`, the assistant endpoints in `src/services/mockApi.js`, the `useAssistantSession` provider, the assistant components under `src/components/features/help/assistant/*`, the `LandingPage`, the locale JSON files, and rewrite `src/utils/walletExport.js` as a jsPDF generator.

Implementation language: **JavaScript / JSX (React 19 + Vite 8 + Tailwind CSS 4)** — taken directly from the existing codebase and the design (the design uses real JS, not pseudocode), so no language selection is required.

Decision logic is concentrated in pure functions so it can be covered by property-based tests (fast-check) tagged to the design's 22 Correctness Properties. Layout/sticky/focus/timing behaviors are covered by component/example tests (Vitest + Testing Library + jsdom). The project currently has **no test runner**, so task 1 wires one up as a prerequisite for every property-test sub-task.

Sequencing keeps the app runnable: pure data-layer logic lands first (most property-testable), then the provider, PDF export, new UI, landing redesign, and i18n; the optional Requirement 14 enhancement is the final, clearly-skippable group.

## Tasks

- [x] 1. Test setup foundation
  - [x] 1.1 Add the test runner and configure it (prerequisite — not optional)
    - Add dev dependencies: `vitest`, `fast-check`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` (pinned versions).
    - Add a `"test": "vitest --run"` script to `package.json` (optionally `"test:watch": "vitest"`).
    - Configure Vitest in `vite.config.js`: `test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.js' }`.
    - Create `src/test/setup.js` importing `@testing-library/jest-dom` and providing a `localStorage` stub when jsdom does not expose one (needed by the mock-API property tests).
    - This task enables every `*`-marked property/component test below; it must be completed before any of them.
    - _Requirements: Testing Strategy (Vitest + fast-check + Testing Library + jsdom); supports verification of all property tests_

- [ ] 2. Data layer: pure logic in `src/data/assistantMock.js`
  - [x] 2.1 Add `GOAL_TILES` and the `GoalTileDef` shape
    - Export `GOAL_TILES` (6 tiles) per the design table — `first_residence`, `register_address`, `renew_permit`, `work`, `change_status`, `something_else` — each `{ id, intent, icon, labelKey, descriptionKey, seedPrompt }`; `icon` uses an `ASSISTANT_ICON_MAP` key; labels are locale keys (not stored literals).
    - Ensure required goals (first residence permit, register address, renew permit) are present and every `intent` is one of `residence | anmeldung | work | general`.
    - _Requirements: 1.1, 2.1, 5.1_
  - [x] 2.2 Write property test for goal-tile mapping
    - **Property 2: Goal-tile mapping is deterministic and well-formed** — every tile maps deterministically to `tile.intent` without free-text classification, repeated mapping is identical, all intents are defined, and the required goals are present.
    - **Validates: Requirements 1.5, 2.1, 2.2, 5.6**
    - fast-check, `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 2: Goal-tile mapping is deterministic and well-formed`.
    - File: `src/data/assistantMock.goals.test.js`
  - [x] 2.3 Add an `intent` override to `simulateAssistantResponse`
    - Change the signature to `simulateAssistantResponse({ prompt, intent, answers, followUpPrompts })`; when `intent` is absent fall back to `detectIntent(prompt)` (preserves current behavior); add `buildWorkCards(answers)` so the `work` intent returns classified cards instead of falling through to general, and route it in `simulateAssistantResponse`.
    - Keep `detectIntent` returning exactly one of `residence | anmeldung | work | general` for any input.
    - _Requirements: 2.3, 2.4, 7.1_
  - [ ] 2.4 Write property test for intent detection totality
    - **Property 1: detectIntent is total and falls back to general** — for any 1–1000 char string `detectIntent` returns one defined intent; keyword-free strings return `general` and `buildGeneralCards()` produces ≥1 card.
    - **Validates: Requirements 2.3, 2.4**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 1: detectIntent is total and falls back to general`.
    - File: `src/data/assistantMock.detect.test.js`
  - [x] 2.5 Tag every card with `category` and `classification`
    - In `buildResidenceCards`, `buildAnmeldungCards`, `buildGeneralCards` (and the new `buildWorkCards`), add `category` (`documents | office | process | timeline | sources | other`) and `classification` (`actionable | advisable`) to each card; map `eligibility`-style guidance to `other`/`advisable`. Apply defaults so existing rendering keeps working.
    - _Requirements: 12.1, 12.6_
  - [ ] 2.6 Write property test for card classification completeness
    - **Property 5: Every action card is classified** — every card produced by the builders has `classification ∈ {actionable, advisable}` and a defined `category`.
    - **Validates: Requirements 12.1**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 5: Every action card is classified`.
    - File: `src/data/assistantMock.classification.test.js`
  - [ ] 2.7 Add the pure `orderActionCards(cards)` helper
    - Export `orderActionCards(cards)` that returns a permutation of the input sorting by fixed rank `documents < office < process < timeline < sources < other`, omitting absent categories while preserving relative order within equal ranks and never dropping a card.
    - _Requirements: 3.6, 12.6_
  - [ ] 2.8 Write property test for action-card ordering
    - **Property 4: Action cards are ordered and fully preserved** — `orderActionCards` returns a permutation containing every input card exactly once, with present categories in the fixed rank order and relative order preserved within equal ranks.
    - **Validates: Requirements 3.6, 12.6**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 4: Action cards are ordered and fully preserved`.
    - File: `src/data/assistantMock.ordering.test.js`
  - [ ] 2.9 Add the Office_Card content to residence/anmeldung builders
    - Add an `office` card (`category: 'office'`, `classification: 'actionable'`) carrying `OfficeCardContent`: `officeType` (`residence → 'Ausländerbehörde'`, `anmeldung → 'Bürgeramt'`, else `null`) with `officeFallback` text when null; `bookingPortal` `{ name, steps[], cityText }` where `cityText` includes the exact `answers.city` when provided and is `null` otherwise; a `whatToBring[]` with ≥1 distinct entry; and `sources[]`. Render the booking and what-to-bring sections even when `officeType` is null.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ] 2.10 Write property test for office-type mapping
    - **Property 10: Office-type mapping** — `officeType` is `Ausländerbehörde` for residence, `Bürgeramt` for anmeldung, and `null` (with fallback message) otherwise, while booking-portal and what-to-bring sections remain present.
    - **Validates: Requirements 4.1, 4.2**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 10: Office-type mapping`.
    - File: `src/data/assistantMock.officeType.test.js`
  - [ ] 2.11 Write property test for office content completeness
    - **Property 11: Office content completeness** — `bookingPortal.name` is non-empty, `bookingPortal.steps` has ≥1 ordered entry, and `whatToBring` has ≥1 entry with all entries distinct.
    - **Validates: Requirements 4.3, 4.4**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 11: Office content completeness`.
    - File: `src/data/assistantMock.officeContent.test.js`
  - [ ] 2.12 Write property test for city inclusion and fallback
    - **Property 12: City inclusion and fallback** — for any provided city, `bookingPortal.cityText` contains that exact string; when no city is provided, `cityText` is `null` with no empty/placeholder city reference.
    - **Validates: Requirements 4.5, 4.6**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 12: City inclusion and fallback`.
    - File: `src/data/assistantMock.city.test.js`
  - [ ] 2.13 Add the pure `buildSummaryCard(...)` helper
    - Export `buildSummaryCard({ goalLabel, intent, answers, cards })` returning `SummaryCardModel` `{ kind, empty, goalLabel, answeredQuestions[], verdict { text, fromCardId }, urgency { level, label, detail, colorToken } }`. Choose the verdict as the first `actionable` card in canonical order (fallback to a generic non-empty message); derive urgency from `answers.permit_expiry` (`expired`/`30_days` → `urgent`, `3_months` → `soon`, else `none`) and the Anmeldung 14-day rule; set `empty: true` when no goal and no answers.
    - _Requirements: 3.2, 3.3, 3.4, 3.7, 11.6, 12.4, 13.2_
  - [ ] 2.14 Write property test for summary content
    - **Property 7: Summary content reflects situation** — `answeredQuestions` covers exactly the answered question ids (each with its answer label), `goalLabel` equals the selected goal, and when both are absent `empty` is true with a "no information yet" message.
    - **Validates: Requirements 3.2, 3.7, 13.2**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 7: Summary content reflects situation`.
    - File: `src/data/assistantMock.summaryContent.test.js`
  - [ ] 2.15 Write property test for the verdict
    - **Property 8: Verdict surfaces the top actionable step** — when ≥1 `actionable` card exists, `verdict.fromCardId` identifies the first actionable card in canonical order; when none exists the verdict is a generic non-empty message.
    - **Validates: Requirements 3.3, 12.4**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 8: Verdict surfaces the top actionable step`.
    - File: `src/data/assistantMock.verdict.test.js`
  - [ ] 2.16 Write property test for urgency labelling
    - **Property 9: Urgency always has a text label** — `urgency.level` maps per rule and `urgency.label` is a non-empty text value distinct per level, independent of color.
    - **Validates: Requirements 3.4, 11.6**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 9: Urgency always has a text label`.
    - File: `src/data/assistantMock.urgency.test.js`

- [ ] 3. Data layer: persistence and continuity in `src/services/mockApi.js`
  - [x] 3.1 Bump `STORAGE_VERSION` to 5 with a non-destructive `migrateSession`
    - Set `STORAGE_VERSION = 5`. Rewrite `migrateSession` to upgrade well-formed older sessions **in place**: ensure `assistant`/`wallet`, set `schemaVersion = 5`, and for each assistant session default `intent ??= null` and `cardCompletion ??= {}`; keep the hard reset only for unparseable/structurally invalid blobs. Preserve existing `cardGroups`, `wallet`, and answers.
    - Confirm `writeStorage` failures propagate to the caller without leaving a partial write (Req 10.5).
    - _Requirements: 10.4, 10.5_
  - [x] 3.2 Write property test for persistence round-trip and migration preservation
    - **Property 18: Session persistence round-trip and migration preservation** — persisting any valid session and reading it back yields a deeply equal session; `migrateSession` preserves all existing data of a well-formed prior-version session while back-filling `intent`/`cardCompletion` and setting `schemaVersion` to current.
    - **Validates: Requirements 10.4**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 18: Session persistence round-trip and migration preservation`. Use the test-env `localStorage` stub.
    - File: `src/services/mockApi.persistence.test.js`
  - [x] 3.3 Add intent continuity to prompt and guided-answer handling
    - In `submitAssistantPrompt({ prompt, sessionId, intent })`: for a new session set `activeSession.intent = intent ?? detectIntent(prompt)`; for a follow-up compute `detected = intent ?? detectIntent(prompt)` and replace `activeSession.intent` only when `detected !== 'general' && detected !== activeSession.intent`, otherwise keep the established intent; pass `intent: activeSession.intent` into `simulateAssistantResponse`.
    - In `submitGuidedAnswer`: pass `activeSession.intent` into `simulateAssistantResponse` so clarifying answers stay on topic.
    - Keep card-group accumulation append-only (always push the new group as the last entry; never replace/remove prior groups).
    - _Requirements: 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ] 3.4 Write property test for intent continuity across follow-ups
    - **Property 14: Intent continuity across follow-ups** — if re-detection returns `general` or the established intent, the follow-up uses the established intent and `session.intent` is unchanged; if it returns a differing defined intent, that intent is used and stored; across follow-ups that never detect a differing defined intent, `session.intent` stays the initial value.
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 14: Intent continuity across follow-ups`.
    - File: `src/services/mockApi.continuity.test.js`
  - [ ] 3.5 Write property test for append-only card groups
    - **Property 13: Card groups are append-only and order-preserving** — processing a prompt or guided answer that yields a new group makes `cardGroups` equal to the prior array followed by exactly one new group; prior entries unchanged in content, order, and count; render order ascends by `createdAt`.
    - **Validates: Requirements 6.1, 6.2, 6.4**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 13: Card groups are append-only and order-preserving`.
    - File: `src/services/mockApi.append.test.js`
  - [ ] 3.6 Write property test for clarifying-question gating
    - **Property 15: Clarifying-question gating** — when required details are missing the response is `needs_more_info` with non-empty `guidedQuestions`, no cards, and existing `cardGroups` unchanged; otherwise the response is `completed` with a card group produced.
    - **Validates: Requirements 6.7, 13.1, 13.3**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 15: Clarifying-question gating`.
    - File: `src/services/mockApi.gating.test.js`
  - [x] 3.7 Let wallet methods target any visible card group
    - Update `addCardToWallet` and `addSessionToWallet` to accept an explicit `cardGroupId` and locate the card/bundle across **all** `cardGroups` (not only the last), so any visible group's cards can be saved; keep dedupe behavior.
    - _Requirements: 6.4, 8.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Provider: evolve `useAssistantSession` (`src/hooks/useAssistantSession.jsx`)
  - [ ] 5.1 Replace last-only card group with full stream + derived summary
    - Replace `currentCardGroup` with `cardGroups` (the full list sorted ascending by `createdAt`); keep a `latestCardGroup` convenience for the wallet toolbar.
    - Add a derived session-level `summary` via `buildSummaryCard` (using the session goal label/intent and merged guided answers).
    - Change `submitPrompt(prompt, { intent } = {})` to pass the optional intent through to `apiService.submitAssistantPrompt`; keep `error` surfacing for failed prompts/follow-ups unchanged (Req 6.5).
    - Fix `isCardInWallet(cardId)` to search across all card groups.
    - _Requirements: 1.7, 3.1, 6.1, 6.2, 6.3, 6.5, 7.1_

- [ ] 6. PDF export: rewrite `src/utils/walletExport.js`
  - [x] 6.1 Add the jsPDF runtime dependency
    - Add `jspdf` (pinned version) to `dependencies` in `package.json`.
    - _Requirements: 8.1_
  - [x] 6.2 Implement the pure `buildExportModel` and filename helper
    - Add `buildExportModel(item)` (pure): normalize a wallet item (single card or full session) or bundle into `{ title, contextSummary, cards[] }` where the context summary (selected goal text + each answered question paired with its answer + follow-ups) comes first, followed by **every** action card in guide order, each with body → steps → checklist items → sources. Refactor `formatContextSummary`/`formatCardContent` to emit line/section arrays the renderer consumes.
    - Add a filename helper reusing the existing slug logic + saved date that always ends in `.pdf` (`migrant-assistant-<slug>-<YYYY-MM-DD>.pdf`).
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  - [ ] 6.3 Write property test for the PDF export model
    - **Property 16: PDF export model order and completeness** — `buildExportModel` produces sections in order context summary → cards → (within each card) body → steps → items → sources, includes the selected goal and every answered question+answer, and includes every action card exactly once in guide order.
    - **Validates: Requirements 8.2, 8.4, 8.5**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 16: PDF export model order and completeness`.
    - File: `src/utils/walletExport.model.test.js`
  - [ ] 6.4 Write property test for the PDF filename
    - **Property 17: PDF filename ends with .pdf** — for any title and date, the generated filename ends with the `.pdf` extension.
    - **Validates: Requirements 8.3**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 17: PDF filename ends with .pdf`.
    - File: `src/utils/walletExport.filename.test.js`
  - [x] 6.5 Implement jsPDF rendering, downloads, and remove legacy exporters
    - Add a thin `renderPdf(model)` that walks the export model with a `y`-cursor, drawing title, context summary, and each card (heading, body, numbered steps, bulleted items, sources as `label: url`), calling `doc.addPage()` on overflow (manual pagination handles up to 50 cards within budget).
    - Add `downloadWalletItemAsPdf(item)` and `downloadWalletBundleAsPdf(bundle)` that build the model + filename, call `doc.save(filename)` client-side, and wrap generation in `try/catch` to surface an error while leaving the guide/saved state unchanged on failure.
    - Remove `downloadTextFile`, `formatWalletItemAsText`, `downloadWalletItem`, `downloadWalletBundle` (txt), and `downloadWalletItemsAsJson` once unreferenced.
    - _Requirements: 8.1, 8.6_
  - [ ] 6.6 Rewire the wallet UI to PDF export
    - Update `WalletPanel.jsx` (per-item download, replace "export all" JSON) and `WalletToolbar` / `AssistantWorkspace` bundle download to call `downloadWalletItemAsPdf` / `downloadWalletBundleAsPdf`; remove imports of the deleted txt/json functions.
    - _Requirements: 8.1, 8.3_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. New entry UI: goal tiles and co-equal free text
  - [ ] 8.1 Create `GoalTile`
    - New `GoalTile.jsx`: a real `<button>` (Tab-reachable, role + accessible name, ≥44×44px tap target, `focus-visible` ring) reusing the `AssistantIcon` + label visual; Enter/Space activate identically to click; label/description sourced from locale with default-locale fallback; calls `onSelect(tile)`.
    - _Requirements: 2.6, 5.3, 11.1, 11.2, 11.3, 11.4_
  - [ ] 8.2 Create `GoalTileGrid`
    - New `GoalTileGrid.jsx`: responsive grid of 3–8 `GoalTile`s fitting the initial viewport alongside the free-text field; render an inline `role="alert"` error region when a selection fails or has no mapped intent; Tab order matches visual order.
    - _Requirements: 1.1, 1.6, 5.1, 5.8, 11.5_
  - [ ] 8.3 Create `NavigatorEntry` with a pure free-text validator
    - New `NavigatorEntry.jsx` composing `GoalTileGrid` and a co-equal `FollowUpInput` (neither visually demoted, labeled to invite describing the situation in the user's own words); map a tile to `{ prompt: tile.seedPrompt, intent: tile.intent }` and free text to `{ prompt }`.
    - Add a pure `validateFreeText(text)` helper enforcing trimmed length 1–1000 before submit (reject empty/whitespace-only or >1000 without starting classification or mutating state); the visible field caps at 500 chars.
    - _Requirements: 1.2, 1.3, 2.3, 2.5, 5.2_
  - [ ] 8.4 Write property test for free-text length validation
    - **Property 3: Free-text length validation** — the validator accepts input iff its trimmed length is 1–1000, and rejects empty or over-length input without invoking classification or mutating state.
    - **Validates: Requirements 1.3, 2.5**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 3: Free-text length validation`.
    - File: `src/components/features/help/assistant/__tests__/navigatorEntry.validation.test.js`

- [ ] 9. Summary-first rendering
  - [ ] 9.1 Create `SummaryCard`
    - New `SummaryCard.jsx` (not an `ActionCardItem`, not part of `cardGroup.cards`) rendering the derived `summary`: selected goal + each answered question/answer, the emphasized "do this next" primary CTA above other details, and urgency conveyed via **text label + color** inside an `aria-live="polite"` region; render the "no situation information yet" message when `summary.empty` while still rendering first. Add a distinct `summary` status style to `assistantUtils.jsx` (separate from `ready`/`recommended`/`needs-info`/`completed`); make the container **sticky** so it stays visible while scrolling.
    - _Requirements: 1.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 6.3, 11.6, 11.7_
  - [ ] 9.2 Create `CardGroupList`
    - New `CardGroupList.jsx` iterating **all** `activeSession.cardGroups` in ascending `createdAt` order, each rendered as a visually bounded group (never a single chat-bubble list) via `ActionCardGrid`; order each group's cards with `orderActionCards` before rendering and show each group's `intro`/follow-up prompt as a separator. Appends new groups below without removing prior ones.
    - _Requirements: 1.4, 6.1, 6.2, 3.6_
  - [ ] 9.3 Reshape the workspace into `NavigatorWorkspace`
    - Evolve `AssistantWorkspace.jsx` into the Navigator layout: render `NavigatorEntry` when there is no session (replacing `AssistantEmptyState` as the default empty view); otherwise render `SessionHeader`, the pinned `SummaryCard`, `GuidedStepPanel` (clarifying questions), `CardGroupList` (all groups), the wallet toolbar/panel, and an always-available `FollowUpInput`. On mount read a one-time router `seed` from `location.state` and call `submitPrompt(seed.prompt, { intent: seed.intent })` when no active session exists. Retain but de-emphasize the "back to help options" affordance. Remove `AssistantEmptyState` once unused (keep `AssistantLoadingCards`).
    - _Requirements: 1.4, 1.7, 6.1, 6.3, 6.6_

- [ ] 10. Extend `ActionCardItem` for classification
  - [ ] 10.1 Render the actionable/advisable classification
    - Add a pure `classificationToStatus(card)` mapping helper (in `assistantUtils.jsx`): `advisable → recommended`, `actionable` with sufficient info → `ready`, `actionable` lacking info → `needs-info`. In `ActionCardItem.jsx` read `card.classification`/`card.category`, apply the mapped status style, and render a localized **text label** ("Action needed" / "Good to know") plus a visual distinction independent of color; render every card (omit none by classification).
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6_
  - [ ] 10.2 Write property test for classification-to-status mapping
    - **Property 6: Classification maps to the correct status** — `advisable → recommended`, `actionable` with info → `ready`, `actionable` lacking info → `needs-info`; the rendered classification label text is the expected non-empty string per classification.
    - **Validates: Requirements 12.3, 12.5**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 6: Classification maps to the correct status`.
    - File: `src/components/features/help/assistant/__tests__/classification.status.test.js`

- [ ] 11. Redesigned landing page (`src/components/features/LandingPage.jsx`)
  - [ ] 11.1 Build the goal-first hero with seed hand-off
    - Replace the two `ModeCard`s with a goal-first hero: a `GoalTileGrid` (3–8 tiles, each ≥44×44px) plus a co-equal free-text `FollowUpInput` labeled to invite asking in the user's own words.
    - On tile activation or free-text submit: `initialize({ restartHelp: true })`, set the help phase to `assistant` (via `showAssistant`/`setHelpPhase`), and `navigate('/dashboard', { state: { seed } })` within 1s where `seed = { prompt, intent? }`; a tile with no mapped intent stays on the landing page and shows an inline error without starting a session.
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7, 5.8_
  - [ ] 11.2 Add the journey motif
    - Add a presentational (non-interactive) journey motif showing the four stages **Arrival → Registration → Permit → Work** in that exact order, reusing the `MapNode`/`TopicMap` disc+label visual as a simple horizontal stepper. All stage labels via locale.
    - _Requirements: 5.4_
  - [ ] 11.3 Preserve trust strip, source all text from locale, demote mode chooser
    - Keep the existing trust strip (`landing.trust.*`) verbatim (title, body, both assurance points); source all visible landing text from the locale system so it re-renders on locale change. Ensure `ChooseHelpMode` is no longer the default landing target (HelpHub still reaches it but the Navigator is primary).
    - _Requirements: 5.5, 5.9, 5.10_

- [ ] 12. Internationalization (`src/i18n/locales/en.json`, `src/i18n/locales/de.json`)
  - [ ] 12.1 Add all new locale keys in English and German
    - Add complete EN + DE entries for every revamp-introduced key across the new namespaces: `navigator.*` (entry title/subtitle, results hints), `goals.*` (tile labels/descriptions), `summary.*` (verdict prefix, `summary.urgency.urgent/soon/none`, empty message), `office.*` (office-type names, booking labels, what-to-bring header, fallback), `classification.*` (actionable/advisable labels), `completion.*` (control, completed state, `completion.progress` `{{done}}/{{total}}`), `export.*` (PDF button/section/error), `landing.journey.*` (Arrival/Registration/Permit/Work) and `landing.goalsTitle`/`landing.freeTextLabel`.
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [ ] 12.2 Write property test for locale key parity
    - **Property 22: Locale key parity for new keys** — for every revamp-introduced key, both the English and German locale objects contain a (non-empty) entry.
    - **Validates: Requirements 9.2**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 22: Locale key parity for new keys`.
    - File: `src/i18n/i18n.parity.test.js`
  - [ ] 12.3 Write property test for the locale fallback chain
    - **Property 21: Locale fallback chain** — for any key present only in English, `t(key)` under any active locale returns the English value; for any key absent in both the active locale and English, `t(key)` returns the key identifier.
    - **Validates: Requirements 9.5, 9.6**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 21: Locale fallback chain`.
    - File: `src/i18n/i18n.fallback.test.js`

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Component, interaction, and smoke tests
  - [ ] 14.1 Write accessibility/keyboard tests for goal tiles
    - Goal tiles render as `<button>` with accessible names; Enter/Space activate identically to click; `focus-visible` ring present; DOM/tab order matches the visual top-to-bottom, left-to-right layout.
    - File: `src/components/features/help/assistant/__tests__/goalTile.a11y.test.jsx`
    - _Requirements: 11.1, 11.2, 11.4, 11.5_
  - [ ] 14.2 Write co-equal entry and persistent follow-up tests
    - Both the goal-tile path and the free-text path render together with neither demoted; a `FollowUpInput` remains present after results so a follow-up can always be submitted.
    - File: `src/components/features/help/assistant/__tests__/navigatorEntry.coequal.test.jsx`
    - _Requirements: 1.2, 5.2, 6.6_
  - [ ] 14.3 Write summary-pinning render test
    - The `SummaryCard` renders first and outside the scrolling `CardGroupList` (anchored once), with the urgency region carrying `aria-live`.
    - File: `src/components/features/help/assistant/__tests__/summaryCard.pinned.test.jsx`
    - _Requirements: 1.7, 3.5, 11.7_
  - [ ] 14.4 Write the localStorage architecture-boundary check
    - A static/grep-style test asserting `localStorage` is referenced only inside `src/services/mockApi.js` and nowhere else in `src/`.
    - File: `src/services/boundary.test.js`
    - _Requirements: 10.1, 10.2_
  - [ ] 14.5 Write guest-session and locale-default smoke tests
    - A guest session initializes with a generated id and no auth/login; with no saved locale preference the locale system defaults to German.
    - File: `src/services/guestSession.smoke.test.js`
    - _Requirements: 9.7, 10.3_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Optional enhancement — Requirement 14 step-completion tracking (skippable)
  - [ ] 16.1 Add completion persistence to the mock API and provider
    - Add `setCardCompletion({ sessionId, cardGroupId, cardId, completed })` to `src/services/mockApi.js` writing `activeSession.cardCompletion[`${cardGroupId}:${cardId}`] = completed`, persisting and returning the session; on persist failure retain prior state and surface an error (Req 14.6, 10.5).
    - Add `cardCompletion`, `toggleCardCompletion(cardGroupId, cardId)`, and a derived `completionProgress` to `useAssistantSession.jsx` with optimistic update + revert-on-failure.
    - _Requirements: 14.3, 14.4, 14.6_
  - [ ] 16.2 Write property test for the completion round-trip
    - **Property 19: Completion round-trip** — any completion map written via `setCardCompletion` is restored identically when the session is read back.
    - **Validates: Requirements 14.3, 14.4**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 19: Completion round-trip`.
    - File: `src/services/mockApi.completion.test.js`
  - [ ] 16.3 Add the completion control to `ActionCardItem`
    - When completion tracking is enabled and the card is `actionable`, render a checkbox-style `<button>` (`aria-pressed`) with a completed text state distinct from not-completed (text in addition to color); call `toggleCardCompletion` and read state from `cardCompletion`. Wire the enabled flag through `CardGroupList`/`ActionCardGrid`.
    - _Requirements: 14.1, 14.2_
  - [ ] 16.4 Add the progress indication
    - Show a progress indication (completed actionable steps / total actionable steps) on the `SummaryCard` or `CardGroupList` header using `completionProgress`.
    - _Requirements: 14.5_
  - [ ] 16.5 Write property test for the progress count
    - **Property 20: Completion progress count** — `total` equals the number of `actionable` cards and `done` equals the number of `actionable` cards marked completed (advisable cards never counted).
    - **Validates: Requirements 14.5**
    - `{ numRuns: 100 }`, comment `// Feature: guided-navigator-revamp, Property 20: Completion progress count`.
    - File: `src/components/features/help/assistant/__tests__/completion.progress.test.js`
  - [ ] 16.6 Write example test for completion restore and persist-failure
    - Toggling completion persists through the mock API and restores on reload; a forced persist failure reverts the optimistic toggle and shows an error indication.
    - File: `src/components/features/help/assistant/__tests__/stepCompletion.test.jsx`
    - _Requirements: 14.4, 14.6_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; this includes all test sub-tasks and the entire Requirement 14 step-completion enhancement (group 16).
- Task 1.1 (test runner setup) is a non-optional prerequisite for every `*` property/component test.
- Each task references specific requirement sub-clauses for traceability; property-test tasks additionally reference their design Correctness Property number (1–22) and use the comment format `// Feature: guided-navigator-revamp, Property {n}: {text}` with fast-check `{ numRuns: 100 }`.
- Property → task map: P1→2.4, P2→2.2, P3→8.4, P4→2.8, P5→2.6, P6→10.2, P7→2.14, P8→2.15, P9→2.16, P10→2.10, P11→2.11, P12→2.12, P13→3.5, P14→3.4, P15→3.6, P16→6.3, P17→6.4, P18→3.2, P19→16.2, P20→16.5, P21→12.3, P22→12.2.
- Checkpoints (tasks 4, 7, 13, 15) ensure incremental validation; all persistence stays behind the mock API (Req 10), and the app remains runnable after each numbered group.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "6.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "6.2"] },
    { "id": 3, "tasks": ["2.4", "2.5", "3.4", "3.5", "3.6", "3.7", "6.3", "6.4", "6.5"] },
    { "id": 4, "tasks": ["2.6", "2.7", "6.6", "8.1"] },
    { "id": 5, "tasks": ["2.8", "2.9", "8.2"] },
    { "id": 6, "tasks": ["2.10", "2.11", "2.12", "2.13", "8.3"] },
    { "id": 7, "tasks": ["2.14", "2.15", "2.16", "5.1", "8.4", "10.1"] },
    { "id": 8, "tasks": ["9.1", "9.2", "10.2", "11.1"] },
    { "id": 9, "tasks": ["9.3", "11.2"] },
    { "id": 10, "tasks": ["11.3", "12.1"] },
    { "id": 11, "tasks": ["12.2", "12.3", "14.1", "14.2", "14.3", "14.4", "14.5"] },
    { "id": 12, "tasks": ["16.1"] },
    { "id": 13, "tasks": ["16.2", "16.3", "16.4"] },
    { "id": 14, "tasks": ["16.5", "16.6"] }
  ]
}
```
