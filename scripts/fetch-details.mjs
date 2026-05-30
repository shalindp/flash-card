// Step 3 of the data pipeline (rich card backs).
// For the first --limit words of alldata.json, fetch English definitions +
// example sentences from dictionaryapi.dev (grouped by part of speech), keep up
// to 3 definitions and 2 examples per POS, translate every English string to
// Sinhala via Google Translate (batched, one request per word), and write
// per-stack detail files src/data/details/<stackId>.json keyed by card id.
//
// Usage:  node scripts/fetch-details.mjs [--limit 100] [--delay 250]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ALLDATA = join(ROOT, 'src', 'data', 'alldata.json')
const CACHE_DIR = join(ROOT, 'raw_data', 'cache')
const DETAILS_DIR = join(ROOT, 'src', 'data', 'details')
const MANUAL = join(__dirname, 'manual-details.json')

const arg = (name, def) => {
  const i = process.argv.indexOf(name)
  return i !== -1 ? process.argv[i + 1] : def
}
const LIMIT = parseInt(arg('--limit', '100'), 10)
const DELAY = parseInt(arg('--delay', '250'), 10)
const STACK_SIZE = 20
const MAX_DEFS = 3
const MAX_EXAMPLES = 2

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const safe = (w) => w.replace(/[^a-z0-9]+/gi, '_')

// ---- dictionaryapi.dev ----
async function getDict(word) {
  const cp = join(CACHE_DIR, `dict_${safe(word)}.json`)
  if (existsSync(cp)) return { text: readFileSync(cp, 'utf8'), cached: true }
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 20000)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    const text = await res.text()
    writeFileSync(cp, text)
    return { text, cached: false }
  } finally {
    clearTimeout(t)
  }
}

// A definition is "junk" if it's circular/empty (e.g. "To run.").
function isJunkDef(def, word) {
  const d = def.trim().toLowerCase().replace(/\.$/, '')
  if (d.length < 8) return true
  if (d === word.toLowerCase()) return true
  if (d === `to ${word.toLowerCase()}`) return true
  return false
}

// Parse dictionary JSON into meanings grouped by POS with capped defs/examples.
function parseDict(text, word) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!Array.isArray(data)) return null // 404 "No Definitions Found"
  const byPos = new Map()
  for (const entry of data) {
    for (const m of entry.meanings || []) {
      const pos = m.partOfSpeech || ''
      if (!byPos.has(pos)) byPos.set(pos, { definitions: [], examples: [] })
      const bucket = byPos.get(pos)
      for (const d of m.definitions || []) {
        const def = (d.definition || '').trim()
        if (!def || isJunkDef(def, word)) continue
        if (bucket.definitions.length < MAX_DEFS && !bucket.definitions.includes(def))
          bucket.definitions.push(def)
        const ex = (d.example || '').trim()
        if (ex && bucket.examples.length < MAX_EXAMPLES && !bucket.examples.includes(ex))
          bucket.examples.push(ex)
      }
    }
  }
  const meanings = []
  for (const [pos, b] of byPos) {
    if (!b.definitions.length && !b.examples.length) continue
    meanings.push({ pos, definitions: b.definitions, examples: b.examples })
  }
  return meanings.length ? meanings : null
}

// ---- Google Translate (batched per word) ----
async function gtTranslate(q) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=si&dt=t&q=${encodeURIComponent(q)}`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 20000)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    const j = await res.json()
    return (j[0] || []).map((seg) => seg[0]).join('')
  } finally {
    clearTimeout(t)
  }
}

// Translate an array of English strings, caching the result per word.
async function translateLines(word, lines) {
  const cp = join(CACHE_DIR, `gtdef_${safe(word)}.json`)
  if (existsSync(cp)) {
    try {
      const cached = JSON.parse(readFileSync(cp, 'utf8')).si
      if (Array.isArray(cached) && cached.length === lines.length) return { si: cached, cached: true }
    } catch { /* re-fetch */ }
  }
  if (!lines.length) {
    writeFileSync(cp, JSON.stringify({ si: [] }))
    return { si: [], cached: false }
  }
  // Batch: join with newlines, split the translation back by newline.
  const joined = await gtTranslate(lines.join('\n'))
  let si = joined.split('\n').map((s) => s.trim())
  // Robustness: if line counts don't match, translate one-by-one.
  if (si.length !== lines.length) {
    si = []
    for (const line of lines) {
      si.push((await gtTranslate(line)).trim())
      await sleep(DELAY)
    }
  }
  writeFileSync(cp, JSON.stringify({ si }))
  return { si, cached: false }
}

// ---- main ----
const cards = JSON.parse(readFileSync(ALLDATA, 'utf8')).slice(0, LIMIT)
const manual = existsSync(MANUAL) ? JSON.parse(readFileSync(MANUAL, 'utf8')) : {}
mkdirSync(CACHE_DIR, { recursive: true })
mkdirSync(DETAILS_DIR, { recursive: true })

const byStack = new Map() // stackId -> { [cardId]: CardDetail }
const missing = []
let net = 0

for (let i = 0; i < cards.length; i++) {
  const card = cards[i]
  let meanings = null

  // 1) dictionary API
  try {
    const { text, cached } = await getDict(card.word)
    if (!cached) {
      net++
      await sleep(DELAY)
    }
    meanings = parseDict(text, card.word)
  } catch {
    /* fall through to manual */
  }

  // 2) manual fallback for words the API doesn't cover
  if (!meanings && manual[card.word]) {
    meanings = manual[card.word].meanings.map((m) => ({
      pos: m.pos,
      definitions: (m.definitions || []).slice(0, MAX_DEFS),
      examples: (m.examples || []).slice(0, MAX_EXAMPLES),
    }))
  }

  if (!meanings) {
    missing.push(card.word)
    continue
  }

  // 3) translate every English string (defs + examples) to Sinhala, batched
  const lines = []
  for (const m of meanings) {
    for (const d of m.definitions) lines.push(d)
    for (const e of m.examples) lines.push(e)
  }
  let si = []
  try {
    const r = await translateLines(card.word, lines)
    si = r.si
    if (!r.cached) {
      net++
      await sleep(DELAY)
    }
  } catch {
    si = lines.map(() => '')
  }

  // 4) stitch English + Sinhala back together
  let k = 0
  const detailMeanings = meanings.map((m) => ({
    pos: m.pos,
    definitions: m.definitions.map((en) => ({ en, si: si[k++] || '' })),
    examples: m.examples.map((en) => ({ en, si: si[k++] || '' })),
  }))

  const stackId = Math.floor((card.id - 1) / STACK_SIZE) + 1
  if (!byStack.has(stackId)) byStack.set(stackId, {})
  byStack.get(stackId)[card.id] = { meanings: detailMeanings }

  if ((i + 1) % 25 === 0)
    console.log(`  …${i + 1}/${cards.length} (${missing.length} missing, ${net} fetched)`)
}

for (const [stackId, obj] of byStack) {
  writeFileSync(join(DETAILS_DIR, `${stackId}.json`), JSON.stringify(obj, null, 2))
}

console.log(`\nDone. Wrote ${byStack.size} stack detail files -> ${DETAILS_DIR}`)
console.log(`Missing from API (no manual entry): ${missing.length}${missing.length ? ' -> ' + missing.join(', ') : ''}`)
