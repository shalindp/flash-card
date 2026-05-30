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
    // Selected text-to-speech voice (voiceURI). Empty = use the device default.
    const voiceURI = ref<string>('')

    function apply() {
      const el = document.documentElement
      el.classList.toggle('dark', darkMode.value)
    }

    function toggleDark() {
      darkMode.value = !darkMode.value
    }

    function setVoice(uri: string) {
      voiceURI.value = uri
    }

    // Keep the <html> class in sync whenever the value changes (including after
    // it is rehydrated from localStorage).
    watch(darkMode, apply, { immediate: false })

    return { darkMode, voiceURI, toggleDark, apply, setVoice }
  },
  { persist: true },
)
