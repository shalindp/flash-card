// Shape of one Sinhala sense for a word.
export interface Sense {
  pos: string // readable part of speech, e.g. "noun"
  si: string // Sinhala (Unicode script)
  roman: string // romanized transliteration
}

// One vocabulary card, as stored in src/data/alldata.json.
export interface Card {
  id: number
  word: string
  pos: string // primary part of speech
  frequency: number // raw corpus frequency
  freqScore: number // 1-10, how common in everyday use
  relatedForms: string[]
  senses: Sense[]
}

// Rich back-of-card content (English-primary, Sinhala supplementary).
export interface DefItem {
  en: string // English definition or example sentence
  si: string // Sinhala translation
}
export interface MeaningDetail {
  pos: string // part of speech, e.g. "noun"
  definitions: DefItem[]
  examples: DefItem[]
}
export interface CardDetail {
  meanings: MeaningDetail[]
}

// A stack of (up to) 20 cards, derived at load time.
export interface Stack {
  id: number // 1-based
  title: string
  group: number // 0-based group of 3 stacks
  cards: Card[]
}
