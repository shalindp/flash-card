// Function words to EXCLUDE from the vocabulary deck.
// Rationale: articles, pronouns, prepositions, conjunctions, auxiliaries and
// modals dominate the top of any frequency list but don't translate to clean
// standalone Sinhala flashcards. We keep nouns/verbs/adjectives/adverbs.
export const FUNCTION_WORDS = new Set([
  // articles
  'a', 'an', 'the',
  // pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours',
  'theirs', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves',
  'yourselves', 'themselves', 'this', 'that', 'these', 'those', 'who', 'whom',
  'whose', 'which', 'what', 'whatever', 'whoever', 'whichever', 'one', 'ones',
  'oneself', 'thou', 'thee', 'thy', 'ye',
  // prepositions
  'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'over', 'under', 'off', 'out', 'onto', 'upon', 'within',
  'without', 'along', 'across', 'behind', 'beyond', 'beside', 'besides', 'near',
  'toward', 'towards', 'amongst', 'among', 'amid', 'per', 'via', 'unto', 'till',
  // conjunctions
  'and', 'but', 'or', 'nor', 'so', 'yet', 'because', 'as', 'until', 'while',
  'if', 'although', 'though', 'unless', 'whereas', 'whether', 'since', 'than',
  'whilst', 'lest',
  // auxiliaries / modals / copula
  'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could',
  'may', 'might', 'must', 'ought', 'cannot',
  // determiners / particles / misc function words
  'not', 'no', 'nor', 'there', 'here', 'then', 'else', 'such', 'own', 'same',
  'each', 'every', 'either', 'neither', 'any', 'some', 'all', 'both', 'few',
  'more', 'most', 'other', 'another', 'much', 'many', 'several',
  'whereby', 'wherein', 'hereby', 'thereby', 'therefore', 'thus', 'hence',
  'however', 'moreover', 'furthermore', 'nevertheless', 'nonetheless',
  'etc', 'ie', 'eg', 'vs',
])
