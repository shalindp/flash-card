<script setup lang="ts">
import { ref } from 'vue'
import { Moon, Sun, Trash2, Info, Volume2 } from 'lucide-vue-next'
import { useSettingsStore } from '../stores/settings'
import { useProgressStore } from '../stores/progress'
import { useTestsStore } from '../stores/tests'
import { useTts } from '../composables/useTts'

const settings = useSettingsStore()
const progress = useProgressStore()
const tests = useTestsStore()
const tts = useTts()

const confirming = ref(false)

function onVoiceChange(lang: 'en' | 'si', e: Event) {
  settings.setVoice(lang, (e.target as HTMLSelectElement).value)
}

function resetAll() {
  progress.reset()
  tests.reset()
  confirming.value = false
}
</script>

<template>
  <div class="mx-auto max-w-xl">
    <h1 class="mb-6 text-2xl font-extrabold">Settings</h1>

    <!-- Appearance -->
    <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-semibold">Dark mode</h2>
          <p class="text-sm text-slate-400">Easier on the eyes at night.</p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="settings.darkMode"
          class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
          :class="settings.darkMode ? 'bg-indigo-600' : 'bg-slate-300'"
          @click="settings.toggleDark()"
        >
          <span
            class="inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow transition-transform"
            :class="settings.darkMode ? 'translate-x-7' : 'translate-x-1'"
          >
            <Sun v-if="!settings.darkMode" class="h-3.5 w-3.5 text-amber-500" />
            <Moon v-else class="h-3.5 w-3.5 text-indigo-600" />
          </span>
        </button>
      </div>
    </div>

    <!-- Pronunciation -->
    <div class="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 class="font-semibold">Pronunciation voices</h2>
      <p class="text-sm text-slate-400">
        Voices used when you tap a speaker on the cards.
      </p>

      <p v-if="!tts.supported" class="mt-3 text-sm text-slate-400">
        Speech is not available in this browser.
      </p>

      <template v-else>
        <!-- English voice -->
        <div class="mt-4">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-400">English</label>
          <div class="mt-1.5 flex items-center gap-2">
            <select
              :value="settings.voiceURI"
              class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              @change="onVoiceChange('en', $event)"
            >
              <option value="">Device default</option>
              <option v-for="v in tts.englishVoices.value" :key="v.voiceURI" :value="v.voiceURI">
                {{ v.name }} ({{ v.lang }})
              </option>
            </select>
            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              @click="tts.speak('This is an example sentence.', 'en')"
            >
              <Volume2 class="h-4 w-4" /> Preview
            </button>
          </div>
        </div>

        <!-- Sinhala voice -->
        <div class="mt-4">
          <label class="text-xs font-semibold uppercase tracking-wide text-slate-400">Sinhala</label>
          <div v-if="tts.sinhalaVoices.value.length" class="mt-1.5 flex items-center gap-2">
            <select
              :value="settings.sinhalaVoiceURI"
              class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              @change="onVoiceChange('si', $event)"
            >
              <option value="">Device default</option>
              <option v-for="v in tts.sinhalaVoices.value" :key="v.voiceURI" :value="v.voiceURI">
                {{ v.name }} ({{ v.lang }})
              </option>
            </select>
            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              @click="tts.speak('මෙය උදාහරණ වාක්‍යයකි.', 'si')"
            >
              <Volume2 class="h-4 w-4" /> Preview
            </button>
          </div>
          <p v-else class="mt-1.5 text-sm text-slate-400">
            No Sinhala voices found on this device (available in Microsoft Edge online; not on iOS).
          </p>
        </div>
      </template>
    </div>

    <!-- Data -->
    <div class="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 class="font-semibold">Reset progress</h2>
      <p class="text-sm text-slate-400">
        Clears all answers, stack progress and unlocked levels. This can't be undone.
      </p>
      <div v-if="!confirming" class="mt-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          @click="confirming = true"
        >
          <Trash2 class="h-4 w-4" /> Reset all progress
        </button>
      </div>
      <div v-else class="mt-3 flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          @click="resetAll"
        >
          Yes, reset everything
        </button>
        <button
          type="button"
          class="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700"
          @click="confirming = false"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- About -->
    <div class="mt-4 flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
      <Info class="h-5 w-5 shrink-0 text-indigo-500" />
      <p>
        Words are ordered by real-world frequency (BNC/COCA). Sinhala meanings come from the Madura
        English–Sinhala dictionary. Master the stacks in order to build everyday listening
        comprehension.
      </p>
    </div>
  </div>
</template>
