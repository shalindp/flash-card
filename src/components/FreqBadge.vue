<script setup lang="ts">
import { computed } from 'vue'
import { Flame } from 'lucide-vue-next'

const props = defineProps<{ score: number }>()

// Colour the badge by how common the word is (green = very common).
const tone = computed(() => {
  if (props.score >= 8) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
  if (props.score >= 5) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
  return 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none"
    :class="tone"
    :title="`Everyday usage frequency: ${score} / 10`"
  >
    <Flame class="h-3 w-3" />
    {{ score }}/10
  </span>
</template>
