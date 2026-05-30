<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import type { Card } from '../types'
import FreqBadge from './FreqBadge.vue'

defineProps<{ card: Card; flipped: boolean }>()
const emit = defineEmits<{ (e: 'flip'): void }>()
</script>

<template>
  <div class="perspective-1000 w-full select-none" @click="emit('flip')">
    <div
      class="preserve-3d relative h-[24rem] w-full transition-transform duration-500 sm:h-[26rem]"
      :class="{ 'rotate-y-180': flipped }"
    >
      <!-- FRONT: the English word -->
      <div
        class="backface-hidden absolute inset-0 flex cursor-pointer flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30"
      >
        <div class="flex items-center justify-between">
          <FreqBadge :score="card.freqScore" />
          <span class="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {{ card.pos }}
          </span>
        </div>

        <div class="flex flex-1 flex-col items-center justify-center">
          <h2 class="text-center text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            {{ card.word }}
          </h2>
        </div>

        <p class="text-center text-sm text-slate-400 dark:text-slate-500">Tap to reveal the meaning</p>
      </div>

      <!-- BACK: Sinhala meaning(s) -->
      <div
        class="backface-hidden rotate-y-180 absolute inset-0 flex cursor-pointer flex-col rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 shadow-xl shadow-indigo-200/40 dark:border-indigo-500/30 dark:from-slate-800 dark:to-slate-900 dark:shadow-black/30"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="text-lg font-bold text-slate-700 dark:text-slate-200">{{ card.word }}</span>
          <RotateCcw class="h-4 w-4 text-slate-400" />
        </div>

        <div class="flex flex-1 flex-col justify-center gap-3 overflow-y-auto">
          <!-- Everyday meaning, shown prominently -->
          <div class="rounded-2xl bg-white/80 px-4 py-4 text-center dark:bg-white/10">
            <div class="font-sinhala text-3xl font-bold text-indigo-700 dark:text-indigo-300">
              {{ card.senses[0].si }}
            </div>
            <p class="mt-1 text-sm italic text-slate-500 dark:text-slate-400">
              {{ card.senses[0].roman }}
            </p>
            <span
              v-if="card.senses[0].pos"
              class="mt-1 inline-block text-[10px] uppercase tracking-wide text-slate-400"
            >
              {{ card.senses[0].pos }}
            </span>
          </div>

          <!-- Additional dictionary senses, de-emphasised -->
          <div v-if="card.senses.length > 1" class="px-1">
            <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Other meanings
            </p>
            <ul class="space-y-0.5">
              <li v-for="(s, i) in card.senses.slice(1)" :key="i" class="text-sm leading-snug">
                <span class="font-sinhala text-slate-600 dark:text-slate-300">{{ s.si }}</span>
                <span class="text-slate-400"> — {{ s.roman }}</span>
              </li>
            </ul>
          </div>
        </div>

        <p
          v-if="card.relatedForms.length"
          class="mt-3 truncate text-center text-xs text-slate-400 dark:text-slate-500"
        >
          Forms: {{ card.relatedForms.slice(0, 5).join(', ') }}
        </p>
      </div>
    </div>
  </div>
</template>
