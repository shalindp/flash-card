// Step 2 of the data pipeline.
// Read scripts/build/wordlist.json, fetch each word's Sinhala meaning(s) from
// the Madura Online dictionary (authoritative, 230k+ definitions), parse the
// senses + part of speech, romanize, and write src/data/alldata.json.
//
// The fetch is rate-limited and disk-cached in raw_data/cache/, so re-runs are
// resumable and idempotent (only un-cached words hit the network).
//
// Usage:  node scripts/fetch-sinhala.mjs [--limit 2000] [--delay 800]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { romanize } from './romanize-sinhala.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const LIST_PATH = join(ROOT, 'scripts', 'build', 'wordlist.json')
const CACHE_DIR = join(ROOT, 'raw_data', 'cache')
const OUT_PATH = join(ROOT, 'src', 'data', 'alldata.json')

const arg = (name, def) => {
  const i = process.argv.indexOf(name)
  return i !== -1 ? process.argv[i + 1] : def
}
const LIMIT = parseInt(arg('--limit', '100000'), 10)
const DELAY = parseInt(arg('--delay', '800'), 10)
const GT_DELAY = parseInt(arg('--gt-delay', '300'), 10)

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

// Strip whitespace and zero-width joiners so two spellings compare equal.
const normalizeSi = (s) => (s || '').replace(/[\s‌‍]/g, '')

// POS abbreviations we treat as everyday vocabulary, mapped to readable labels.
const POS_LABELS = {
  n: 'noun', v: 'verb', vt: 'verb', vi: 'verb', vti: 'verb',
  adj: 'adjective', adv: 'adverb', interj: 'interjection', num: 'number',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function cachePath(word) {
  const safe = word.replace(/[^a-z0-9]+/gi, '_')
  return join(CACHE_DIR, `${safe}.html`)
}

async function getHtml(word) {
  const cp = cachePath(word)
  if (existsSync(cp)) return { html: readFileSync(cp, 'utf8'), cached: true }
  const url = `https://www.maduraonline.com/?find=${encodeURIComponent(word)}`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 20000)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: ctrl.signal,
    })
    const html = await res.text()
    writeFileSync(cp, html)
    return { html, cached: false }
  } finally {
    clearTimeout(t)
  }
}

// Fetch the single everyday primary translation from Google Translate. Madura
// lists senses alphabetically (surfacing archaic terms first), so we use this
// as the authoritative "common" meaning. Cached as JSON; returns { si, cached }.
async function getGt(word) {
  const cp = join(CACHE_DIR, `gt_${word.replace(/[^a-z0-9]+/gi, '_')}.json`)
  if (existsSync(cp)) {
    try {
      return { si: JSON.parse(readFileSync(cp, 'utf8')).si || '', cached: true }
    } catch {
      return { si: '', cached: true }
    }
  }
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=si&dt=t&q=${encodeURIComponent(word)}`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 20000)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal })
    const j = await res.json()
    const si = (j[0] || []).map((seg) => seg[0]).join('').trim()
    writeFileSync(cp, JSON.stringify({ si }))
    return { si, cached: false }
  } catch {
    return { si: '', cached: false }
  } finally {
    clearTimeout(t)
  }
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

// Parse the dictionary HTML into { senses: [{pos, si}], notFound }.
function parse(html) {
  const tableMatch = html.match(/<table class="tb">([\s\S]*?)<\/table>/)
  if (!tableMatch) return { senses: [], notFound: true, suggestion: null }
  const body = tableMatch[1]
  const rows = body.match(/<tr>[\s\S]*?<\/tr>/g) || []
  const senses = []
  let suggestionList = false
  let suggestion = null
  for (const tr of rows) {
    const ty = tr.match(/<td class="ty">([\s\S]*?)<\/td>/)
    const td = tr.match(/<td class="td">([\s\S]*?)<\/td>/)
    if (!td) continue
    const rawTd = td[1]
    if (/<a\s/i.test(rawTd)) {
      // "did you mean" suggestion list — remember the first suggested word
      suggestionList = true
      if (!suggestion) {
        const m = rawTd.match(/\?find=([^"'&]+)/)
        if (m) suggestion = decodeURIComponent(m[1])
      }
      continue
    }
    const si = decodeEntities(rawTd)
    if (!si) continue
    const posRaw = ty ? decodeEntities(ty[1]).replace(/\.$/, '').toLowerCase() : ''
    senses.push({ posRaw, si })
  }
  if (senses.length === 0) return { senses: [], notFound: suggestionList, suggestion }
  return { senses, notFound: false, suggestion: null }
}

function generalSenses(parsedSenses) {
  // Prefer everyday parts of speech; fall back to any sense so we never drop a
  // word that has a real translation under a technical tag.
  const general = parsedSenses.filter((s) => POS_LABELS[s.posRaw])
  const list = general.length ? general : parsedSenses
  return list.map((s) => ({
    pos: POS_LABELS[s.posRaw] || s.posRaw || '',
    si: s.si,
    roman: romanize(s.si),
  }))
}

const words = JSON.parse(readFileSync(LIST_PATH, 'utf8')).slice(0, LIMIT)
mkdirSync(CACHE_DIR, { recursive: true })
mkdirSync(dirname(OUT_PATH), { recursive: true })

const out = []
const skipped = []
let netCount = 0

for (let idx = 0; idx < words.length; idx++) {
  const w = words[idx]
  let html, cached
  try {
    ({ html, cached } = await getHtml(w.word))
  } catch (e) {
    skipped.push({ word: w.word, reason: 'fetch-error: ' + e.message })
    continue
  }
  if (!cached) {
    netCount++
    await sleep(DELAY)
  }
  let parsed = parse(html)
  // Fallback: if Madura returned only a "did you mean" list, follow the first
  // suggestion (e.g. "patients" -> "patient") and use its senses instead.
  if ((parsed.notFound || parsed.senses.length === 0) && parsed.suggestion) {
    try {
      const sug = await getHtml(parsed.suggestion)
      if (!sug.cached) {
        netCount++
        await sleep(DELAY)
      }
      const p2 = parse(sug.html)
      if (p2.senses.length) parsed = p2
    } catch { /* keep original (empty) result */ }
  }

  const madura = parsed.senses.length ? generalSenses(parsed.senses) : []
  // Dominant Madura POS, used when the everyday word isn't in the dictionary list.
  const posCounts = {}
  for (const s of madura) posCounts[s.pos] = (posCounts[s.pos] || 0) + 1
  const dominantPos = madura.map((s) => s.pos).sort((a, b) => posCounts[b] - posCounts[a])[0] || ''

  // Everyday primary translation (ranked by common usage), with delay only on a
  // real network call.
  let gtSi = ''
  try {
    const r = await getGt(w.word)
    gtSi = r.si
    if (!r.cached) {
      netCount++
      await sleep(GT_DELAY)
    }
  } catch { /* fall back to Madura below */ }

  // Build senses: the everyday meaning first, then a couple of dictionary senses.
  let primary
  if (gtSi) {
    const match = madura.find((s) => normalizeSi(s.si) === normalizeSi(gtSi))
    primary = match || { pos: dominantPos, si: gtSi, roman: romanize(gtSi) }
  } else if (madura.length) {
    primary = madura[0]
  } else {
    // No dictionary entry (even after suggestion) and no GT translation.
    skipped.push({ word: w.word, reason: 'no-translation' })
    continue
  }
  const extras = madura
    .filter((s) => normalizeSi(s.si) !== normalizeSi(primary.si))
    .slice(0, 2)
  const finalSenses = [primary, ...extras]

  out.push({
    id: out.length + 1,
    word: w.word,
    pos: primary.pos || dominantPos,
    frequency: w.frequency,
    freqScore: w.freqScore,
    relatedForms: w.relatedForms,
    senses: finalSenses,
  })
  if ((idx + 1) % 100 === 0) {
    console.log(`  …${idx + 1}/${words.length} processed (${out.length} kept, ${skipped.length} skipped, ${netCount} fetched)`)
  }
}

// Re-id sequentially so stacks chunk cleanly (skips don't leave gaps).
out.forEach((e, i) => (e.id = i + 1))
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2))

console.log(`\nDone. ${out.length} cards -> ${OUT_PATH}`)
console.log(`Skipped ${skipped.length}: ${skipped.slice(0, 40).map((s) => s.word).join(', ')}${skipped.length > 40 ? ' …' : ''}`)
writeFileSync(join(__dirname, 'build', 'skipped.json'), JSON.stringify(skipped, null, 2))
