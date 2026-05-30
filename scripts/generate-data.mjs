// Step 1 of the data pipeline.
// Parse the BNC/COCA frequency CSV, drop function words, sort by real-world
// frequency, take the top N content words, and emit an intermediate word list
// (id, word, frequency, freqScore 1-10, relatedForms[]) for the scraper.
//
// Usage:  node scripts/generate-data.mjs [--limit 2000]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FUNCTION_WORDS } from './function-words.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CSV_PATH = join(ROOT, 'raw_data', 'BNC_COCA_lists - Sheet1.csv')
const OUT_PATH = join(ROOT, 'scripts', 'build', 'wordlist.json')

const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : 2000

// --- minimal CSV parser that handles quoted fields containing commas ---
function parseCsv(text) {
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = ''
    } else if (c === '\r') {
      // ignore
    } else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

// Extract clean related word forms from e.g. "able (29930), abilities (1334)".
function parseRelatedForms(raw, headword) {
  const forms = []
  const re = /([a-zA-Z][a-zA-Z'-]*)\s*\(\d+\)/g
  let m
  while ((m = re.exec(raw)) !== null) {
    const w = m[1].toLowerCase()
    if (w !== headword && !forms.includes(w)) forms.push(w)
  }
  return forms.slice(0, 8)
}

const text = readFileSync(CSV_PATH, 'utf8')
const rows = parseCsv(text)
rows.shift() // header

const candidates = []
for (const row of rows) {
  if (row.length < 4) continue
  const word = (row[1] || '').trim().toLowerCase()
  const freq = parseInt((row[3] || '').trim(), 10)
  if (!word || Number.isNaN(freq)) continue
  // keep simple alphabetic words only (no spaces, digits, length >= 2)
  if (!/^[a-z][a-z'-]+$/.test(word)) continue
  if (word.length < 2) continue
  if (FUNCTION_WORDS.has(word)) continue
  candidates.push({ word, freq, related: parseRelatedForms(row[2] || '', word) })
}

candidates.sort((a, b) => b.freq - a.freq)
const top = candidates.slice(0, LIMIT)

// freqScore on a log scale across the selected set -> 1..10
const logs = top.map((c) => Math.log(c.freq))
const lo = Math.min(...logs)
const hi = Math.max(...logs)
const score = (freq) =>
  hi === lo ? 10 : Math.max(1, Math.round(1 + 9 * ((Math.log(freq) - lo) / (hi - lo))))

const out = top.map((c, i) => ({
  id: i + 1,
  word: c.word,
  frequency: c.freq,
  freqScore: score(c.freq),
  relatedForms: c.related,
}))

mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2))
console.log(
  `Wrote ${out.length} words to ${OUT_PATH}\n` +
    `  freq range: ${out[out.length - 1].frequency.toLocaleString()} .. ${out[0].frequency.toLocaleString()}\n` +
    `  sample: ${out.slice(0, 12).map((w) => w.word).join(', ')}`,
)
