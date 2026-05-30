<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: number; max: number }>()
const pct = computed(() => (props.max ? Math.min(100, (props.value / props.max) * 100) : 0))
</script>

<template>
  <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
    <div
      class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
      :style="{ width: pct + '%' }"
    />
  </div>
</template>
