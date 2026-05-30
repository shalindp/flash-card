<script setup lang="ts">
import { computed } from 'vue'
import { Trophy, RotateCcw, ArrowRight, ClipboardCheck } from 'lucide-vue-next'

const props = defineProps<{
  correct: number
  total: number
  /** label for the primary "continue" action, if any */
  nextLabel?: string
}>()
const emit = defineEmits<{ (e: 'retry'): void; (e: 'next'): void }>()

const accuracy = computed(() => (props.total ? Math.round((props.correct / props.total) * 100) : 0))
const great = computed(() => accuracy.value >= 80)
</script>

<template>
  <div class="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900">
    <div
      class="animate-pop mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl text-white"
      :class="great ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-indigo-500 to-violet-500'"
    >
      <Trophy class="h-8 w-8" />
    </div>
    <h2 class="text-2xl font-extrabold">Session complete!</h2>
    <p class="mt-1 text-slate-500 dark:text-slate-400">
      You got <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ correct }}</span>
      of {{ total }} correct
    </p>

    <div class="my-6">
      <div class="text-5xl font-black" :class="great ? 'text-emerald-500' : 'text-indigo-500'">
        {{ accuracy }}%
      </div>
      <div class="text-xs uppercase tracking-wide text-slate-400">accuracy</div>
    </div>

    <div class="flex flex-col gap-3">
      <button
        v-if="nextLabel"
        type="button"
        class="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
        @click="emit('next')"
      >
        <component :is="nextLabel.includes('test') ? ClipboardCheck : ArrowRight" class="h-5 w-5" />
        {{ nextLabel }}
      </button>
      <button
        type="button"
        class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        @click="emit('retry')"
      >
        <RotateCcw class="h-5 w-5" />
        Study again
      </button>
    </div>
  </div>
</template>
