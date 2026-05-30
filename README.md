# VocabFlow — English vocabulary for Sinhala speakers

A flashcard web app that teaches the most common English words first, each with
its Sinhala meaning. Master the stacks in frequency order and you build the
vocabulary needed to follow everyday conversation and movies.

## Features

- **Frequency-ordered cards** from the BNC/COCA word list — the most useful words first.
- **Sinhala meanings** (Unicode script + romanization) from the Madura English–Sinhala dictionary.
- Front of each card shows the word, its part of speech, and an everyday-usage **frequency badge (1–10)**.
- **Shuffle + flip** study sessions: tap to reveal the meaning, then mark Correct / Incorrect with visual feedback.
- **Stacks of 20**, grouped into levels of 3. A **100% multiple-choice test** (show the word, pick the correct Sinhala meaning from 5 randomized options) of the level's words unlocks the next level.
- **Progress tracking** (accuracy, words mastered, per-stack history) and **dark mode**, all saved to `localStorage`.
- Responsive: bottom nav bar on mobile, top header on desktop.

## Tech stack

Vite · Vue 3 (`<script setup>` + TypeScript) · Pinia (+ persisted state) · Vue Router · Tailwind CSS v4 · Bun.

## Getting started

```bash
bun install
bun run dev
```

## Regenerating the card data

Card data lives in `src/data/alldata.json`. It is produced by two scripts:

```bash
bun run data:list      # parse raw_data CSV -> top-N content words (scripts/build/wordlist.json)
bun run data:sinhala   # scrape Sinhala meanings from Madura -> src/data/alldata.json
# or both:
bun run data
```

- `scripts/generate-data.mjs` — filters function words, sorts by frequency, takes the top N (`--limit`, default 2000), computes a 1–10 frequency score, and parses related word forms.
- `scripts/fetch-sinhala.mjs` — for each word it takes the **everyday primary** translation from Google Translate (Madura lists senses alphabetically, surfacing archaic terms first) and appends Madura's dictionary senses + part of speech, then romanizes. If Madura only returns a "did you mean?" suggestion list, it follows the first suggestion (e.g. `patients` → `patient`). Responses are cached in `raw_data/cache/` so re-runs are fast and resumable; add more words by raising `--limit` and re-running.

To add more vocabulary, raise the limit and re-run `bun run data` — the app automatically chunks the larger `alldata.json` into more stacks and levels.
