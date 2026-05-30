import { computed, ref } from 'vue'
import { useSettingsStore } from '../stores/settings'

// Browser text-to-speech via the Web Speech API. Module-level state is shared
// across all callers (FlashCard, Settings) so they see the same voice list and
// "currently speaking" status.
const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

const voices = ref<SpeechSynthesisVoice[]>([])
// The exact text currently being spoken (null when idle) — drives the active
// animation and the press-again-to-stop toggle.
const speakingText = ref<string | null>(null)

let initialized = false

function loadVoices() {
  if (!supported) return
  const list = window.speechSynthesis.getVoices()
  if (list.length) voices.value = list
}

function init() {
  if (!supported || initialized) return
  initialized = true
  loadVoices()
  // Voices often populate asynchronously — listen for the event and retry.
  window.speechSynthesis.onvoiceschanged = loadVoices
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
  setTimeout(loadVoices, 300)
  setTimeout(loadVoices, 1200)
}
init()

type Lang = 'en' | 'si'

const voicesFor = (lang: Lang) =>
  voices.value.filter((v) => v.lang?.toLowerCase().startsWith(lang))

const englishVoices = computed(() => voicesFor('en'))
const sinhalaVoices = computed(() => voicesFor('si'))

// Whether the device offers any voice for a language (Sinhala is missing on iOS,
// present in Edge's online voices). Reads voices.value so it stays reactive.
function hasVoiceFor(lang: Lang): boolean {
  return voicesFor(lang).length > 0
}

// The voice to speak with: the user's saved choice for that language, else the
// device's default voice for it, with sensible fallbacks.
function resolveVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const list = voices.value
  if (!list.length) return undefined
  const settings = useSettingsStore()
  const savedURI = lang === 'si' ? settings.sinhalaVoiceURI : settings.voiceURI
  if (savedURI) {
    const match = list.find((v) => v.voiceURI === savedURI)
    if (match) return match
  }
  const inLang = (v: SpeechSynthesisVoice) => v.lang?.toLowerCase().startsWith(lang)
  const region = lang === 'si' ? 'si-lk' : 'en-us'
  return (
    list.find((v) => v.default && inLang(v)) ||
    list.find((v) => v.lang?.toLowerCase().startsWith(region)) ||
    list.find(inLang) ||
    undefined
  )
}

// Speak `text` in `lang`. Pressing while the same text is playing stops it
// (toggle); pressing a different one cancels the current and starts the new.
function speak(text: string, lang: Lang = 'en') {
  if (!supported || !text) return
  const synth = window.speechSynthesis
  const sameActive = speakingText.value === text
  synth.cancel()
  if (sameActive) {
    speakingText.value = null
    return
  }
  const u = new SpeechSynthesisUtterance(text)
  const voice = resolveVoice(lang)
  if (voice) u.voice = voice
  u.lang = voice?.lang || (lang === 'si' ? 'si-LK' : 'en-US')
  u.onstart = () => {
    speakingText.value = text
  }
  u.onend = () => {
    if (speakingText.value === text) speakingText.value = null
  }
  u.onerror = () => {
    if (speakingText.value === text) speakingText.value = null
  }
  speakingText.value = text // optimistic — some engines fire onstart late
  synth.speak(u)
}

export function useTts() {
  return {
    supported,
    voices,
    englishVoices,
    sinhalaVoices,
    hasVoiceFor,
    speakingText,
    speak,
    loadVoices,
  }
}
