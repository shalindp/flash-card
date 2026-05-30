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

const englishVoices = computed(() =>
  voices.value.filter((v) => v.lang?.toLowerCase().startsWith('en')),
)

// The voice to speak with: the user's saved choice, else the device's default
// English voice, with sensible fallbacks.
function resolveVoice(): SpeechSynthesisVoice | undefined {
  const list = voices.value
  if (!list.length) return undefined
  const { voiceURI } = useSettingsStore()
  if (voiceURI) {
    const match = list.find((v) => v.voiceURI === voiceURI)
    if (match) return match
  }
  const en = (v: SpeechSynthesisVoice) => v.lang?.toLowerCase().startsWith('en')
  return (
    list.find((v) => v.default && en(v)) ||
    list.find((v) => v.lang?.toLowerCase().startsWith('en-us')) ||
    list.find(en) ||
    list.find((v) => v.default) ||
    list[0]
  )
}

// Speak `text`. Pressing while the same text is playing stops it (toggle);
// pressing a different one cancels the current and starts the new immediately.
function speak(text: string) {
  if (!supported || !text) return
  const synth = window.speechSynthesis
  const sameActive = speakingText.value === text
  synth.cancel()
  if (sameActive) {
    speakingText.value = null
    return
  }
  const u = new SpeechSynthesisUtterance(text)
  const voice = resolveVoice()
  if (voice) u.voice = voice
  u.lang = voice?.lang || 'en-US'
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
  return { supported, voices, englishVoices, speakingText, speak, loadVoices }
}
