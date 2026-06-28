# DigitalFabrik Frontend

Frontend application for **Migrant Assistant** — a German bureaucracy navigation prototype built with React, Tailwind CSS, and Lucide Icons.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview
```

## Architecture

- **UI components** — presentation-only, no direct `localStorage` access
- **`src/services/mockApi.js`** — API abstraction layer (Guest Mode uses localStorage internally; swap this file for a real backend)
- **Custom hooks** — `useGuestSession`, `useJourneyState`, `useLocale` orchestrate state and API calls
- **Full EN/DE i18n** — locale strings in `src/i18n/locales/`

## User Flow

1. **Landing Page** — choose Guest Mode (Personalized Mode is disabled in prototype)
2. **Help Hub** — choose Guided Interview or Browse Topics
3. **Ausländer Guided Interview** — 6 steps (journey stage, visa status, goal, documents, appointment status, confirm)
4. **Document Checklist** — required vs. missing docs based on your answers
5. **Journey Map** — explore unlocked topics with intake and action decks

Clear guest session data in DevTools (`localStorage` key: `migrant_assistant_guest`) to replay the onboarding flow. Clicking **Get started as guest** on the landing page also resets the help flow automatically.

## License

TBD
