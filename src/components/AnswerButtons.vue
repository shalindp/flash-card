<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'

defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ (e: 'answer', correct: boolean): void }>()
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <button
      type="button"
      :disabled="disabled"
      class="group flex items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 py-4 text-base font-semibold text-rose-600 transition-all active:scale-95 enabled:hover:border-rose-300 enabled:hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:enabled:hover:bg-rose-500/20"
      @click="emit('answer', false)"
    >
      <X class="h-6 w-6" />
      Incorrect
    </button>
    <button
      type="button"
      :disabled="disabled"
      class="group flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 py-4 text-base font-semibold text-emerald-600 transition-all active:scale-95 enabled:hover:border-emerald-300 enabled:hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:enabled:hover:bg-emerald-500/20"
      @click="emit('answer', true)"
    >
      <Check class="h-6 w-6" />
      Correct
    </button>
  </div>
</template>
