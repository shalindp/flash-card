<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { Layers, BarChart3, Settings, Moon, Sun, Sparkles } from 'lucide-vue-next'
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()
const route = useRoute()

const tabs = [
  { name: 'stacks', to: '/', label: 'Stacks', icon: Layers },
  { name: 'progress', to: '/progress', label: 'Progress', icon: BarChart3 },
  { name: 'settings', to: '/settings', label: 'Settings', icon: Settings },
]

const activeName = computed(() => route.name as string)
// Study/test are full-focus screens — hide the bottom bar to give the card room.
const immersive = computed(() => ['study', 'test'].includes(route.name as string))
</script>

<template>
  <!-- Desktop / tablet: top header -->
  <header
    class="hidden md:block sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80"
  >
    <div class="mx-auto flex h-16 max-w-5xl items-center gap-6 px-6">
      <RouterLink to="/" class="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
          <Sparkles class="h-5 w-5" />
        </span>
        <span class="text-lg">VocabFlow</span>
      </RouterLink>

      <nav class="ml-4 flex items-center gap-1">
        <RouterLink
          v-for="t in tabs"
          :key="t.name"
          :to="t.to"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="
            activeName === t.name
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          "
        >
          <component :is="t.icon" class="h-4 w-4" />
          {{ t.label }}
        </RouterLink>
      </nav>

      <button
        type="button"
        class="ml-auto grid h-10 w-10 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        :aria-label="settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="settings.toggleDark()"
      >
        <Moon v-if="!settings.darkMode" class="h-5 w-5" />
        <Sun v-else class="h-5 w-5" />
      </button>
    </div>
  </header>

  <!-- Mobile: bottom navigation bar (hidden during study/test) -->
  <nav
    v-if="!immersive"
    class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-900/95"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="mx-auto flex max-w-md items-stretch justify-around">
      <RouterLink
        v-for="t in tabs"
        :key="t.name"
        :to="t.to"
        class="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors"
        :class="
          activeName === t.name
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 dark:text-slate-400'
        "
      >
        <component :is="t.icon" class="h-5 w-5" />
        {{ t.label }}
      </RouterLink>
    </div>
  </nav>
</template>
