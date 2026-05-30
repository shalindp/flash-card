// Lightweight Sinhala (Unicode) -> Latin transliterator.
// Sinhala is an abugida: consonants carry an inherent "a" vowel, dependent
// vowel signs replace it, and the "hal kirima" (U+0DCA) removes it. Some vowels
// ("o", "oo", "ee") are encoded as multi-codepoint sequences beginning with the
// e-prefix U+0DD9, which we handle with lookahead. This is a pronunciation aid,
// not a strict standard, so it favours readability.

const INDEPENDENT_VOWELS = {
  'අ': 'a', 'ආ': 'aa', 'ඇ': 'ae', 'ඈ': 'aae', 'ඉ': 'i', 'ඊ': 'ii',
  'උ': 'u', 'ඌ': 'uu', 'ඍ': 'ru', 'ඎ': 'ruu', 'එ': 'e', 'ඒ': 'ee',
  'ඓ': 'ai', 'ඔ': 'o', 'ඕ': 'oo', 'ඖ': 'au',
}

// consonant -> base sound (inherent "a" appended unless a vowel sign follows)
const CONSONANTS = {
  'ක': 'k', 'ඛ': 'kh', 'ග': 'g', 'ඝ': 'gh', 'ඞ': 'ng', 'ඟ': 'ng',
  'ච': 'ch', 'ඡ': 'chh', 'ජ': 'j', 'ඣ': 'jh', 'ඤ': 'ny', 'ඥ': 'gny', 'ඦ': 'nj',
  'ට': 't', 'ඨ': 'th', 'ඩ': 'd', 'ඪ': 'dh', 'ණ': 'n', 'ඬ': 'nd',
  'ත': 'th', 'ථ': 'thh', 'ද': 'd', 'ධ': 'dh', 'න': 'n', 'ඳ': 'nd',
  'ප': 'p', 'ඵ': 'ph', 'බ': 'b', 'භ': 'bh', 'ම': 'm', 'ඹ': 'mb',
  'ය': 'y', 'ර': 'r', 'ල': 'l', 'ව': 'w', 'ශ': 'sh', 'ෂ': 'sh',
  'ස': 's', 'හ': 'h', 'ළ': 'l', 'ෆ': 'f',
}

// single-codepoint dependent vowel signs (replace the inherent "a")
const VOWEL_SIGNS = {
  'ා': 'aa', 'ැ': 'ae', 'ෑ': 'aae', 'ි': 'i', 'ී': 'ii',
  'ු': 'u', 'ූ': 'uu', 'ෘ': 'ru', 'ේ': 'ee', 'ෛ': 'ai',
  'ො': 'o', 'ෝ': 'oo', 'ෞ': 'au', 'ෟ': 'lu', 'ෲ': 'ruu',
}

const HAL = '්'
const E_PREFIX = 'ෙ'
const AA_SIGN = 'ා'
const LU_SIGN = 'ෟ'
const ANUSVARA = 'ං' // ං
const VISARGA = 'ඃ' // ඃ

// Read the vowel that follows a consonant at position i.
// Returns { vowel, consumed }. vowel === null means inherent "a".
function readVowel(s, i) {
  const c = s[i]
  if (c === undefined) return { vowel: 'a', consumed: 0 }
  if (c === HAL) return { vowel: '', consumed: 1 }
  if (c === E_PREFIX) {
    const n1 = s[i + 1]
    const n2 = s[i + 2]
    if (n1 === AA_SIGN && n2 === HAL) return { vowel: 'oo', consumed: 3 }
    if (n1 === AA_SIGN) return { vowel: 'o', consumed: 2 }
    if (n1 === HAL) return { vowel: 'ee', consumed: 2 }
    if (n1 === LU_SIGN) return { vowel: 'au', consumed: 2 }
    return { vowel: 'e', consumed: 1 }
  }
  if (VOWEL_SIGNS[c] !== undefined) return { vowel: VOWEL_SIGNS[c], consumed: 1 }
  return { vowel: 'a', consumed: 0 }
}

export function romanize(input) {
  if (!input) return ''
  const s = input.normalize('NFC')
  let out = ''
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (CONSONANTS[c] !== undefined) {
      const { vowel, consumed } = readVowel(s, i + 1)
      out += CONSONANTS[c] + vowel
      i += 1 + consumed
    } else if (INDEPENDENT_VOWELS[c] !== undefined) {
      out += INDEPENDENT_VOWELS[c]
      i += 1
    } else if (c === ANUSVARA) {
      out += 'n'
      i += 1
    } else if (c === VISARGA) {
      out += 'h'
      i += 1
    } else if (c === ' ') {
      out += ' '
      i += 1
    } else if (c === '‍' || c === '‌') {
      // zero-width (non-)joiner: needed for conjunct rendering, not pronounced
      i += 1
    } else {
      // punctuation or unknown mark — keep as-is
      out += c
      i += 1
    }
  }
  return out.trim()
}
