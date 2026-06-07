# Notation

A guitarist's songwriting journal — chord charts, guitar tabs, and AI screenshot import.
Mobile-first, installable PWA, with a shared collaborative library.

## Stack

- **React + TypeScript + Vite**, **HeroUI** (Tailwind v4)
- **Firebase Firestore** — shared, offline-first persistence (IndexedDB cache + realtime sync)
- **PWA** via `vite-plugin-pwa` (installable, offline app shell, self-hosted fonts)
- **AI import** — a Vercel serverless function (`api/extract-chart.ts`) calls an
  OpenAI-compatible LLM gateway (LangChain `ChatOpenAI`) to transcribe a photo of a
  chord chart into an editable song. Server-side only; the key never reaches the browser.

## Features

- Journal of songs with search
- Create/edit song metadata (key, tempo, capo, time signature, tuning, tags)
- **Chords Writer** — bar-by-bar builder with a full beat-subdivision rhythm system
- **Tabs Writer** — column-model 6-string editor with a custom on-screen keyboard
  (frets 0–25, bends up/down/pre, slides, slurs, harmonics, vibrato, P.M., barlines…)
- Performance/read view with the standard rhythm-slash chord rendering
- **AI import** — snap a chart photo → structured, editable song

## Develop

```bash
pnpm install
pnpm dev                      # frontend only (no /api functions)
pnpm test                     # unit tests (notation engines)
pnpm build && pnpm preview    # production build + PWA service worker
```

Full stack with the AI function locally (Vercel CLI):

```bash
set -a; . ./.env.local; set +a       # load env into the process
pnpm dlx vercel dev --listen 3000
```

> `vercel dev` doesn't read Vite's `.env.local` automatically, so it's sourced into the
> process above. The plain `pnpm dev` server does not run `/api` functions.

## Environment

Copy `.env.example` → `.env.local` and fill in. See that file for the full list:
Firebase web config (`VITE_FIREBASE_*`), and the server-side AI gateway vars
(`OPENAI_BASE_URL`, `OPENAI_API_KEY`, `NOTATION_AI_MODEL`, `AI_IMPORT_PASSPHRASE`).

For production, set the same variables in the Vercel project settings.

## Firestore rules

`firestore.rules` defines an open-but-validated shared library. Deploy with:

```bash
firebase deploy --only firestore:rules
```
