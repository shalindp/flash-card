<script setup lang="ts">
import { computed } from 'vue'
import { Volume2 } from 'lucide-vue-next'
import { useTts } from '../composables/useTts'

const props = withDefaults(
  defineProps<{ text: string; size?: 'sm' | 'md'; lang?: 'en' | 'si' }>(),
  { size: 'sm', lang: 'en' },
)

const tts = useTts()
const active = computed(() => tts.speakingText.value === props.text)
// Hide when this language has no voice on the device (e.g. Sinhala on iOS).
const available = computed(() => tts.supported && tts.hasVoiceFor(props.lang))
</script>

<template>
  <!-- padding + equal negative margin = larger tap target ("hit slop") without
       affecting layout -->
  <button
    v-if="available"
    type="button"
    :aria-label="active ? 'Stop' : 'Listen'"
    title="Listen"
    class="-m-2.5 inline-flex shrink-0 items-center justify-center rounded-full p-2.5 text-indigo-500 transition-transform active:scale-90 hover:text-indigo-600 dark:text-indigo-400"
    :class="active ? 'text-indigo-600 dark:text-indigo-300' : ''"
    @click.stop="tts.speak(text, lang)"
  >
    <Volume2
      :class="[
        size === 'md' ? 'h-6 w-6' : 'h-4 w-4',
        active ? 'animate-pulse text-indigo-600 dark:text-indigo-300' : '',
      ]"
    />
  </button>
</template>
