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

    function apply() {
      const el = document.documentElement
      el.classList.toggle('dark', darkMode.value)
    }

    function toggleDark() {
      darkMode.value = !darkMode.value
    }

    // Keep the <html> class in sync whenever the value changes (including after
    // it is rehydrated from localStorage).
    watch(darkMode, apply, { immediate: false })

    return { darkMode, toggleDark, apply }
  },
  { persist: true },
)
