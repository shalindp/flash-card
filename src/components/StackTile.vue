<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Lock, Check, BookOpen } from 'lucide-vue-next'
import type { Stack } from '../types'
import { useProgressStore } from '../stores/progress'

const props = defineProps<{ stack: Stack; locked: boolean }>()
const progress = useProgressStore()

const completed = computed(() => progress.isStackCompleted(props.stack.id))
const accuracy = computed(() => progress.stackAccuracy(props.stack.id))
const wordRange = computed(() => {
  const ids = props.stack.cards
  return `${ids.length} words`
})
</script>

<template>
  <component
    :is="locked ? 'div' : RouterLink"
    :to="locked ? undefined : `/study/${stack.id}`"
    class="group relative flex items-center gap-4 rounded-2xl border p-4 transition-all"
    :class="
      locked
        ? 'cursor-not-allowed border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/40'
        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/50'
    "
  >
    <div
      class="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-bold"
      :class="
        locked
          ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
          : completed
            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
            : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400'
      "
    >
      <Lock v-if="locked" class="h-5 w-5" />
      <Check v-else-if="completed" class="h-5 w-5" />
      <span v-else>{{ stack.id }}</span>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h3 class="truncate font-semibold" :class="locked ? 'text-slate-400 dark:text-slate-600' : ''">
          {{ stack.title }}
        </h3>
      </div>
      <p class="text-xs text-slate-400 dark:text-slate-500">
        <template v-if="locked">Locked</template>
        <template v-else-if="completed">Best accuracy {{ accuracy }}%</template>
        <template v-else>{{ wordRange }} · not started</template>
      </p>
    </div>

    <BookOpen
      v-if="!locked"
      class="h-5 w-5 text-slate-300 transition-colors group-hover:text-indigo-500 dark:text-slate-600"
    />
  </component>
</template>
