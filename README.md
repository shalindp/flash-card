# VocabFlow — English vocabulary for Sinhala speakers

A flashcard web app that teaches the most common English words first, each with
its Sinhala meaning. Master the stacks in frequency order and you build the
vocabulary needed to follow everyday conversation and movies.

## Features

- **Frequency-ordered cards** from the BNC/COCA word list — the most useful words first.
- **Sinhala meanings** (Unicode script + romanization) from the Madura English–Sinhala dictionary.
- Front of each card shows the word, its part of speech, and an everyday-usage **frequency badge (1–10)**.
- **Shuffle + flip** study sessions: tap to reveal the meaning, then mark Correct / Incorrect with visual feedback.
- **English-primary card backs** (for the first 2,500 words so far): real example sentences first, then English definitions grouped by part of speech (horizontally scrollable) — each with a small Sinhala translation underneath. Cards beyond that fall back to the Sinhala-translation back.
- **Tap-to-hear (text-to-speech):** a speaker button next to the word and on each example sentence reads the English aloud via the browser's Web Speech API. The voice is selectable in Settings (English voices) and persisted. Tap again to stop; tapping another cancels the first.
- **Stacks of 20**, grouped into levels of 3. A **100% multiple-choice test** (show the word, pick the correct Sinhala meaning from 5 randomized options) of the level's words unlocks the next level.
- **Progress tracking** (accuracy, words mastered, per-stack history) and **dark mode**, all saved to `localStorage`.
- Responsive: bottom nav bar on mobile, top header on desktop.
- **Installable PWA** — works offline (app + all word data are precached by a service worker) and can be added to the iOS/Android home screen with its own icon and standalone (full-screen) view.

## Tech stack

Vite · Vue 3 (`<script setup>` + TypeScript) · Pinia (+ persisted state) · Vue Router · Tailwind CSS v4 · Bun.

## Getting started

```bash
bun install
bun run dev
```

## Install as an app (PWA)

The production build (`bun run build`) emits a web app manifest + service worker (via `vite-plugin-pwa`), so VocabFlow is installable and works offline. The service worker is only active in the built/preview app, not in `bun run dev`.

- **iOS (Safari):** open the deployed site → Share → **Add to Home Screen**. It launches full-screen with the VocabFlow icon. (iOS requires the site to be served over HTTPS.)
- **Android/desktop (Chrome/Edge):** use the browser's **Install app** prompt.

Test locally with `bun run build && bun run preview` (service workers run on `localhost`).

## Regenerating the card data

Card data lives in `src/data/alldata.json`. It is produced by two scripts:

```bash
bun run data:list      # parse raw_data CSV -> top-N content words (scripts/build/wordlist.json)
bun run data:sinhala   # scrape Sinhala meanings from Madura -> src/data/alldata.json
bun run data           # the two steps above
bun run data:details   # rich backs: definitions + examples + Sinhala -> src/data/details/<stack>.json
```

- `scripts/generate-data.mjs` — filters function words, sorts by frequency, takes the top N (`--limit`, default 2000), computes a 1–10 frequency score, and parses related word forms.
- `scripts/fetch-sinhala.mjs` — for each word it takes the **everyday primary** translation from Google Translate (Madura lists senses alphabetically, surfacing archaic terms first) and appends Madura's dictionary senses + part of speech, then romanizes. If Madura only returns a "did you mean?" suggestion list, it follows the first suggestion (e.g. `patients` → `patient`). Responses are cached in `raw_data/cache/` so re-runs are fast and resumable; add more words by raising `--limit` and re-running.

- `scripts/fetch-details.mjs` (`bun run data:details [--limit 100]`) — for each word, fetches English definitions + example sentences from `dictionaryapi.dev` (up to 3 defs / 2 examples per part of speech), translates every string to Sinhala via one batched Google Translate request, and writes per-stack files `src/data/details/<stackId>.json` (loaded on demand). Words the API lacks are filled from `scripts/manual-details.json`.

To add more vocabulary, raise the limit and re-run `bun run data` — the app automatically chunks the larger `alldata.json` into more stacks and levels. To extend the rich backs beyond the first 2,500 words, run `bun run data:details --limit <N>` (cached/resumable).
