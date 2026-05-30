<script setup lang="ts">
import { computed } from 'vue'
import { Volume2 } from 'lucide-vue-next'
import { useTts } from '../composables/useTts'

const props = withDefaults(defineProps<{ text: string; size?: 'sm' | 'md' }>(), {
  size: 'sm',
})

const tts = useTts()
const active = computed(() => tts.speakingText.value === props.text)
</script>

<template>
  <!-- padding + equal negative margin = larger tap target ("hit slop") without
       affecting layout -->
  <button
    v-if="tts.supported"
    type="button"
    :aria-label="active ? 'Stop' : 'Listen'"
    title="Listen"
    class="-m-2.5 inline-flex shrink-0 items-center justify-center rounded-full p-2.5 text-indigo-500 transition-transform active:scale-90 hover:text-indigo-600 dark:text-indigo-400"
    :class="active ? 'text-indigo-600 dark:text-indigo-300' : ''"
    @click.stop="tts.speak(text)"
  >
    <Volume2
      :class="[
        size === 'md' ? 'h-6 w-6' : 'h-4 w-4',
        active ? 'animate-pulse text-indigo-600 dark:text-indigo-300' : '',
      ]"
    />
  </button>
</template>
