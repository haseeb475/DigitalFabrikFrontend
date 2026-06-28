# Requirements Document

## Introduction

The Guided Navigator Revamp evolves the existing free-form "assistant workspace" of the Migrant Assistant prototype away from a chatbot-style interaction into a guided navigator. The product helps migrants move through German bureaucratic processes (e.g. residence permits, address registration) by offering two co-equal entry paths presented together: tappable goal cards, and an always-available free-text input where users can describe their situation in their own words. The anti-chatbot quality comes not from hiding free-text input but from (a) offering concrete goal tiles so users are never stuck at a blank void, and (b) rendering output as a structured summary plus action cards rather than a linear scroll of chat-message bubbles. The first card is always a summary of the user's situation and the single most important next step, followed by ordered action cards (required documents, where to go, step-by-step process, deadlines, official sources). Each step is classified as either an actionable step the user must do or advisable guidance worth knowing, and users may ask follow-up questions through free text at any point after results.

This revamp covers: a goal-first landing page and intent-selection experience that presents goal tiles and free-text input as co-equal entry paths, summary-first structured card output with a fixed ordering, an actionable-versus-advisable classification of steps, office-information content, a two-way follow-up loop (system-initiated clarifying questions before results and user-initiated follow-ups after results), an optional progress tracker for completed steps, replacing the current text/JSON export with client-side PDF export, and preservation of the existing EN/DE internationalization and the mock-API/localStorage architecture boundary.

This is a hackathon deliverable, so scope favors demo impact and achievable, client-side-only changes over backend work. Accessibility conventions already present in the codebase are preserved throughout.

## Glossary

- **Navigator**: The redesigned guided assistant experience that replaces the chatbot-style workspace, encompassing goal selection, structured card output, and follow-up handling.
- **Landing_Page**: The application entry screen (`src/components/features/LandingPage.jsx`) that introduces the product and lets a guest start.
- **Goal_Tile**: A large tappable card on the Landing_Page or Navigator representing a predefined user goal (e.g. "Get my first residence permit", "Register my address", "Renew my permit").
- **Free_Text_Entry**: The always-available free-text input control through which a user can describe their situation or ask a question in their own words, presented as a co-equal entry path alongside Goal_Tiles.
- **Intent**: The internal classification of what a user wants to accomplish (e.g. `residence`, `anmeldung`, `work`, `general`), used to select question sets and card content.
- **Session**: A single guided interaction stored in the assistant state, containing the original goal/prompt, follow-up prompts, guided answers, and generated card groups.
- **Card_Group**: A generated set of cards produced from one prompt or set of answers, stored in `Session.cardGroups`.
- **Action_Card**: A single structured card describing one step or topic (documents, office, process, timeline, sources), rendered by `ActionCardItem`.
- **Actionable_Step**: A step the user must actively perform (e.g. book an appointment, gather a document, submit a form), represented as an Action_Card classified as actionable.
- **Advisable_Step**: Advisory guidance the user should know but is not required to perform as a discrete task (e.g. recommendations, tips, warnings), represented as an Action_Card classified as advisable and aligned with the `recommended` card status.
- **Summary_Card**: A distinct first card that restates the user's situation, their answered questions, a clear verdict/what-to-do, and urgency.
- **Office_Card**: An Action_Card describing where to go (Ausländerbehörde/Bürgeramt, booking portal, what to bring).
- **Follow_Up_Mechanism**: The behavior that lets a user ask additional questions after cards are shown, implemented across `submitAssistantPrompt` (`src/services/mockApi.js`), `simulateAssistantResponse` (`src/data/assistantMock.js`), `useAssistantSession`, and the assistant components.
- **Guided_Question**: A system-initiated clarifying question presented to the user before results are produced (or in response to a follow-up), implemented via `GuidedStepPanel` and the Session's pending-questions state, used to gather missing situation details.
- **Mock_API**: The persistence layer `apiService` in `src/services/mockApi.js`, backed by `localStorage`; the only layer permitted to access `localStorage`.
- **PDF_Exporter**: The client-side module that generates a downloadable PDF from a saved guide, replacing the current text/JSON export in `src/utils/walletExport.js`.
- **Locale_System**: The EN/DE internationalization system in `src/i18n/useLocale.jsx` with locale JSON files in `src/i18n/locales/`.
- **Guest_Mode**: The only active mode of the application; Personalized Mode is disabled.

## Requirements

### Requirement 1: Anti-Chatbot Navigator Experience

**User Story:** As a migrant who feels overwhelmed by bureaucracy, I want a guided experience that offers clear goal options alongside the freedom to describe my situation in my own words, so that I am never stuck at a blank chat box yet never prevented from typing what I actually need.

#### Acceptance Criteria

1. WHEN the Navigator loads its starting view, THE Navigator SHALL display between 3 and 12 tappable Goal_Tiles within the initial viewport without requiring the user to scroll.
2. WHEN the Navigator loads its starting view, THE Navigator SHALL present a Free_Text_Entry control together with the Goal_Tiles as a co-equal entry path, with both paths visible in the initial viewport and neither path visually demoted relative to the other.
3. THE Navigator SHALL accept Free_Text_Entry input of 1 to 500 characters and SHALL label the Free_Text_Entry with text inviting the user to describe their situation in their own words, without labeling it as secondary to selecting a Goal_Tile.
4. WHEN a Session produces results, THE Navigator SHALL render those results as one or more discrete Card_Groups, each visually bounded as a separate card, and SHALL NOT render results as a single continuous list of chat message bubbles.
5. WHEN a user selects a Goal_Tile, THE Navigator SHALL start a Session using the Intent associated with that Goal_Tile within 1 second of the selection.
6. IF starting a Session for a selected Goal_Tile fails or no Intent is associated with that Goal_Tile, THEN THE Navigator SHALL retain the Goal_Tile selection view, display an error indication stating that the request could not be started, and SHALL NOT navigate away from the selection view.
7. WHILE a Session has produced at least one Card_Group, THE Navigator SHALL keep the Summary_Card visible in the viewport regardless of scrolling through other Card_Groups.

### Requirement 2: Goal-Driven Intent Selection

**User Story:** As a user, I want to choose my goal from predefined options or describe it in my own words, so that the assistant understands my situation whether I tap a tile or type, with both options treated as first-class ways to begin.

#### Acceptance Criteria

1. THE Navigator SHALL provide Goal_Tiles for at least the following goals: obtaining a first residence permit, registering an address, and renewing a permit, each mapped to one of the defined Intents `residence`, `anmeldung`, `work`, or `general`.
2. WHEN a user selects a Goal_Tile, THE Navigator SHALL deterministically map the selection to its associated defined Intent within 1 second, without invoking free-text classification.
3. WHEN a user submits Free_Text_Entry input of 1 to 1000 characters, THE Navigator SHALL classify the text into a defined Intent within 1 second and start a Session, granting the free-text path the same ability to begin a Session as selecting a Goal_Tile.
4. IF free-text classification finds no specific Intent match, THEN THE Navigator SHALL classify the text as the `general` Intent and present at least one starting-point card.
5. IF a user submits Free_Text_Entry input that is empty or exceeds 1000 characters, THEN THE Navigator SHALL reject the submission and retain the current view and state without starting a new classification.
6. THE Navigator SHALL display each Goal_Tile with a label sourced from the Locale_System, falling back to the default locale label when the active-locale label is missing.

### Requirement 3: Summary-First Structured Card Output

**User Story:** As a user, I want the first thing I see to be a clear summary of my situation and what to do, so that I understand my position before reading detailed steps.

#### Acceptance Criteria

1. WHEN a Card_Group containing at least one card is rendered, THE Navigator SHALL display a Summary_Card as the first card in the visual order, positioned before any Action_Card.
2. WHEN a Summary_Card is rendered, THE Summary_Card SHALL display each question the user answered together with the answer given, and SHALL display the user's selected goal.
3. WHEN a Summary_Card is rendered, THE Summary_Card SHALL display a verdict that states the single most important next action as a clearly distinguished primary call-to-action ("do this next"), visually emphasized above the user's other answered details.
4. WHERE the user's selected goal has an associated deadline or processing window, THE Summary_Card SHALL display an urgency indicator that states the remaining time or deadline date.
5. WHEN a Summary_Card is rendered, THE Navigator SHALL apply to the Summary_Card a status style distinct from the ready, recommended, and needs-info styles used for Action_Cards, so that the Summary_Card is visually identifiable as not being an Action_Card.
6. WHEN a Card_Group is rendered, THE Navigator SHALL order any present Action_Cards after the Summary_Card in the sequence: required documents, where to go, step-by-step process, deadlines and timeline, official sources, omitting any category for which no Action_Card exists while preserving the relative order of the remaining categories.
7. IF a Card_Group is rendered with no user answers and no selected goal available for the Summary_Card, THEN THE Navigator SHALL render the Summary_Card with a message indicating that no situation information is available and SHALL still display the Summary_Card as the first card.

### Requirement 4: Office Information Content

**User Story:** As a user, I want to know exactly where to go and what to bring, so that I can attend the correct office appointment prepared.

#### Acceptance Criteria

1. WHEN the Office_Card is displayed for an Intent, THE Office_Card SHALL display the responsible office type, mapping residence Intents to Ausländerbehörde and address registration Intents to Bürgeramt.
2. IF the Intent has no mapped office type, THEN THE Office_Card SHALL display a message indicating that the responsible office could not be determined, while still rendering the remaining Office_Card sections.
3. THE Office_Card SHALL display instructions for accessing the appointment booking portal, including the portal name and the ordered navigation steps required to reach the booking page.
4. THE Office_Card SHALL display a list of at least one required item the user must bring to the appointment, with each item shown as a distinct list entry.
5. WHERE the user has provided a city, THE Office_Card SHALL display that exact city name within the booking guidance text.
6. IF the user has not provided a city, THEN THE Office_Card SHALL display booking guidance without any city reference and without an empty or placeholder city field.

### Requirement 5: Redesigned Landing Page

**User Story:** As a first-time visitor, I want a landing page that feels welcoming and clear rather than like a chatbot, so that I trust the product and know how to begin.

#### Acceptance Criteria

1. THE Landing_Page SHALL present a goal-first hero containing between 3 and 8 Goal_Tiles as a prominent primary entry action.
2. THE Landing_Page SHALL present a Free_Text_Entry control within the hero as a co-equal entry path alongside the Goal_Tiles, labeled to invite the user to ask in their own words, such that the user can begin either by tapping a Goal_Tile or by submitting free text.
3. THE Landing_Page SHALL render each Goal_Tile with a minimum tap target of 44 by 44 CSS pixels.
4. THE Landing_Page SHALL present a journey motif displaying the four stages Arrival, Registration, Permit, and Work in that exact order.
5. THE Landing_Page SHALL display the existing privacy and trust reassurance content, including the trust title, trust body, and both trust assurance points.
6. WHEN a user activates a Goal_Tile on the Landing_Page, THE Navigator SHALL begin a Session for the Intent mapped to that Goal_Tile and navigate away from the Landing_Page within 1 second.
7. WHEN a user submits Free_Text_Entry input on the Landing_Page, THE Navigator SHALL begin a Session for the classified Intent and navigate away from the Landing_Page within 1 second.
8. IF a user activates a Goal_Tile that has no mapped Intent, THEN THE Navigator SHALL keep the user on the Landing_Page and display an error message indicating the selected goal is unavailable, without starting a Session.
9. THE Landing_Page SHALL source all visible text from the Locale_System, providing a complete string for every displayed text element in both English and German.
10. WHEN the active Locale_System language changes, THE Landing_Page SHALL re-render all visible text in the newly selected language.

### Requirement 6: Follow-Up Context Preservation

**User Story:** As a user, I want my earlier guidance to stay visible when I ask a follow-up question, so that I keep the full picture instead of losing my place.

#### Acceptance Criteria

1. WHEN a user submits a follow-up question while the active Session contains one or more Card_Groups, THE Navigator SHALL keep all previously generated Card_Groups of that Session visible, ordered by ascending creation time from oldest to newest.
2. WHEN a follow-up question produces a new Card_Group, THE Navigator SHALL append the new Card_Group after the existing Card_Groups within 1 second of receiving the Mock_API response, without removing, replacing, or hiding any prior Card_Group.
3. WHILE one or more follow-up Card_Groups are displayed, THE Navigator SHALL keep the Summary_Card visible.
4. WHEN the Mock_API processes a follow-up question that yields a new Card_Group, THE Mock_API SHALL append the new Card_Group as the last entry of `Session.cardGroups` while retaining all existing entries in their original order and count.
5. IF a follow-up question fails to produce a new Card_Group, THEN THE Navigator SHALL retain all previously generated Card_Groups and the Summary_Card in view unchanged, and SHALL display an error indication informing the user that the follow-up could not be processed.
6. WHILE a Session displays one or more Card_Groups, THE Navigator SHALL keep a Free_Text_Entry control available at all times so the user can submit a follow-up question after any set of results.
7. WHERE a submitted follow-up question lacks information the Navigator needs to produce a complete Card_Group, THE Navigator SHALL present one or more Guided_Questions to the user before generating the follow-up Card_Group, while keeping all prior Card_Groups and the Summary_Card visible.

### Requirement 7: Follow-Up Intent Continuity

**User Story:** As a user asking a sensible follow-up like "what documents do I need?", I want the assistant to stay on my original topic, so that I receive relevant cards instead of generic ones.

#### Acceptance Criteria

1. WHEN a user submits a follow-up question within a Session, THE Navigator SHALL use the Session's established Intent as the default Intent for generating that follow-up's Card_Group.
2. IF re-running Intent detection on a follow-up question's text returns the `general` fallback Intent, or returns an Intent equal to the Session's established Intent, THEN THE Navigator SHALL generate the follow-up Card_Group using the Session's established Intent.
3. WHERE re-running Intent detection on a follow-up question's text returns a defined Intent (one of the finite set of defined topic Intents, excluding the `general` fallback) that differs from the Session's established Intent, THE Navigator SHALL generate the follow-up Card_Group using that newly detected Intent.
4. THE Navigator SHALL store the Session's established Intent in the Session such that it persists unchanged across all follow-up submissions until replaced by a newly detected defined Intent.
5. WHEN the Navigator generates a follow-up Card_Group using a newly detected defined Intent that differs from the Session's established Intent, THE Navigator SHALL replace the Session's established Intent with that newly detected Intent.

### Requirement 8: PDF Export of Saved Guides

**User Story:** As a user, I want to save my guide as a PDF, so that I can keep it or take it to the office.

#### Acceptance Criteria

1. WHEN a user chooses to save or download a guide, THE PDF_Exporter SHALL generate a PDF document entirely on the client without contacting a backend, completing generation for a guide of up to 50 cards within 10 seconds.
2. THE PDF_Exporter SHALL include content in the order: context summary, cards, steps, sources.
3. WHEN PDF generation completes, THE PDF_Exporter SHALL produce a downloadable file whose name ends with the `.pdf` extension.
4. THE PDF_Exporter SHALL include the user's context summary, displaying the selected goal text and each answered question paired with its answer.
5. WHERE a guide contains multiple Action_Cards, THE PDF_Exporter SHALL include every Action_Card in the exported PDF, in the same order they appear in the guide.
6. IF PDF generation fails, THEN THE PDF_Exporter SHALL display an error indication and SHALL leave the guide and its saved state unchanged.

### Requirement 9: Internationalization Preservation

**User Story:** As a user who reads English or German, I want all new screens and content available in my language, so that I can use the navigator comfortably.

#### Acceptance Criteria

1. THE Navigator SHALL source all user-facing text introduced by this revamp from the Locale_System rather than from hardcoded string literals.
2. THE Locale_System SHALL provide both an English entry and a German entry for every text key introduced by this revamp.
3. WHEN the active locale is German, THE Navigator SHALL display every revamp-introduced user-facing string via its German Locale_System entry.
4. WHEN the active locale is English, THE Navigator SHALL display every revamp-introduced user-facing string via its English Locale_System entry.
5. IF a text key has no entry for the active locale, THEN THE Locale_System SHALL fall back to the English entry for that key.
6. IF a text key has no entry for either the active locale or English, THEN THE Locale_System SHALL display the key identifier as an observable signal of the missing entry.
7. WHEN no locale preference has been saved, THE Locale_System SHALL default to German.

### Requirement 10: Architecture Boundary Preservation

**User Story:** As a developer maintaining this prototype, I want persistence to stay behind the mock API, so that the architecture remains clean and swappable for a real backend.

#### Acceptance Criteria

1. THE Navigator SHALL perform all Session read, write, and update operations exclusively through the Mock_API, with no direct `localStorage` access from outside the Mock_API.
2. THE Navigator SHALL confine `localStorage` access to the Mock_API, such that no UI component, hook, or other module outside the Mock_API references `localStorage`.
3. THE Navigator SHALL operate in Guest_Mode using only a locally generated Session identifier, without requiring an account, login, or Personalized Mode.
4. WHEN Session data changes, THE Mock_API SHALL persist the complete updated Session to `localStorage` and return the updated Session to the caller.
5. IF persisting a Session to `localStorage` fails, THEN THE Mock_API SHALL surface an error to the caller and SHALL leave any previously persisted Session unchanged.

### Requirement 11: Accessibility Preservation

**User Story:** As a user relying on assistive technology, I want the new navigator to remain accessible, so that I can operate it with a keyboard and screen reader.

#### Acceptance Criteria

1. THE Navigator SHALL render each Goal_Tile as a control that is reachable via the Tab key and exposes a programmatic role and accessible name to assistive technology.
2. WHEN a Goal_Tile has keyboard focus and the user presses Enter or Space, THE Navigator SHALL activate that Goal_Tile and trigger the same action as a pointer click.
3. THE Navigator SHALL provide a text alternative or accessible label for each non-text control introduced by this revamp, such that no introduced control is announced by a screen reader as empty or unlabeled.
4. WHILE any interactive element holds keyboard focus, THE Navigator SHALL display a focus indicator that is visually distinct from that element's unfocused state.
5. WHEN the user moves focus forward with the Tab key across Navigator controls, THE Navigator SHALL move focus in an order that matches the visual top-to-bottom, left-to-right layout sequence.
6. THE Summary_Card SHALL convey each urgency level through a text label in addition to color, such that the urgency level is unambiguously determinable when color is removed or unavailable.
7. WHEN the Summary_Card urgency level changes after initial render, THE Summary_Card SHALL announce the updated urgency to assistive technology without requiring the user to move focus.

### Requirement 12: Actionable and Advisable Steps

**User Story:** As a user, I want to clearly tell apart the things I must actually do from the advice that is just good to know, so that I can complete my bureaucratic process without missing a required action or confusing a tip for a task.

#### Acceptance Criteria

1. WHEN an Action_Card is rendered, THE Navigator SHALL classify that Action_Card as either an Actionable_Step or an Advisable_Step.
2. THE Navigator SHALL render Actionable_Steps with a visual distinction (such as a status style, label, or grouping) that differentiates them from Advisable_Steps, such that a user can determine a card's classification without reading its full body text.
3. THE Navigator SHALL convey each Action_Card's actionable-versus-advisable classification through a text label in addition to any color or icon, such that the classification is determinable when color is removed or unavailable.
4. WHEN a Card_Group contains at least one Actionable_Step, THE Summary_Card SHALL surface the single most important Actionable_Step as the primary call-to-action described in Requirement 3.
5. THE Navigator SHALL render Advisable_Steps using a status aligned with the `recommended` card status, distinct from the `ready` status used for available Actionable_Steps and the `needs-info` status used for steps requiring more information.
6. WHEN a Card_Group is rendered, THE Navigator SHALL display every Action_Card it contains, including both Actionable_Steps and Advisable_Steps, omitting none on the basis of its classification.

### Requirement 13: System-Initiated Clarifying Questions

**User Story:** As a user whose situation is not fully captured by my goal or first message, I want the assistant to ask me focused clarifying questions before showing my guide, so that the resulting summary and steps actually fit my circumstances.

#### Acceptance Criteria

1. WHERE a started Session lacks situation details the Navigator needs to produce a complete Summary_Card and Card_Group, THE Navigator SHALL present one or more Guided_Questions to the user before rendering the first Card_Group.
2. WHEN the user answers the presented Guided_Questions, THE Navigator SHALL generate the Card_Group using those answers and SHALL include each answered Guided_Question and its answer in the Summary_Card.
3. WHERE the Navigator has sufficient situation details to produce a complete Card_Group without further input, THE Navigator SHALL generate the Card_Group without presenting Guided_Questions.
4. WHEN the user submits a follow-up question after results, THE Navigator MAY present one or more additional Guided_Questions in response before generating the follow-up Card_Group, while keeping all prior Card_Groups and the Summary_Card visible.
5. IF the user declines or skips a presented Guided_Question, THEN THE Navigator SHALL generate the Card_Group using the available information without blocking on the unanswered Guided_Question.

### Requirement 14: Optional Step Completion Tracking (Enhancement)

**User Story:** As a user working through my guide, I optionally want to check off the actionable steps I have completed, so that the guide also serves as a progress tracker and I can see what remains. *(This requirement is an optional enhancement scoped for the hackathon; it is client-side only and not required for the core experience.)*

#### Acceptance Criteria

1. WHERE step completion tracking is enabled, THE Navigator SHALL render a completion control for each Actionable_Step that lets the user mark that step as completed or not completed.
2. WHEN a user marks an Actionable_Step as completed, THE Navigator SHALL display that step with a completed visual state distinct from its not-completed state, conveyed through a text indication in addition to any color.
3. WHEN a user marks an Actionable_Step as completed or not completed, THE Navigator SHALL persist the updated completion state through the Mock_API, with no direct `localStorage` access from outside the Mock_API.
4. WHEN a Session with previously persisted completion states is reloaded, THE Navigator SHALL restore each Actionable_Step's completion state as last persisted.
5. WHERE step completion tracking is enabled, THE Navigator SHALL display a progress indication summarizing the number of completed Actionable_Steps relative to the total number of Actionable_Steps in the Session.
6. IF persisting a completion state through the Mock_API fails, THEN THE Navigator SHALL retain the prior persisted completion state and display an error indication that the change could not be saved.
