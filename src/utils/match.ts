import type { Card } from '../types'

// Normalize an answer for comparison: lowercase, trim, collapse inner
// whitespace, and drop a leading "to " (so "to run" matches "run"). Case and
// whitespace differences are ignored; everything else must match exactly.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^to\s+/, '')
}

// A typed answer is correct only if it exactly matches (after normalization)
// the headword or one of its related word forms. Typos are not accepted.
export function isCorrectAnswer(input: string, card: Card): boolean {
  const answer = normalize(input)
  if (!answer) return false
  if (answer === normalize(card.word)) return true
  return card.relatedForms.some((form) => normalize(form) === answer)
}
