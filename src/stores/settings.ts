import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const prefersDark =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const darkMode = ref<boolean>(prefersDark)
    // Selected text-to-speech voices (by voiceURI). Empty = device default.
    const voiceURI = ref<string>('') // English
    const sinhalaVoiceURI = ref<string>('') // Sinhala
    // Whether Sinhala text-to-speech (the Sinhala speaker buttons) is enabled.
    const sinhalaTtsEnabled = ref<boolean>(true)

    function apply() {
      const el = document.documentElement
      el.classList.toggle('dark', darkMode.value)
    }

    function toggleDark() {
      darkMode.value = !darkMode.value
    }

    function setVoice(lang: 'en' | 'si', uri: string) {
      if (lang === 'si') sinhalaVoiceURI.value = uri
      else voiceURI.value = uri
    }

    function toggleSinhalaTts() {
      sinhalaTtsEnabled.value = !sinhalaTtsEnabled.value
    }

    // Keep the <html> class in sync whenever the value changes (including after
    // it is rehydrated from localStorage).
    watch(darkMode, apply, { immediate: false })

    return {
      darkMode,
      voiceURI,
      sinhalaVoiceURI,
      sinhalaTtsEnabled,
      toggleDark,
      apply,
      setVoice,
      toggleSinhalaTts,
    }
  },
  { persist: true },
)
