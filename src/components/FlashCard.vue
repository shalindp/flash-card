<script setup lang="ts">
import { computed } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import type { Card, CardDetail } from '../types'
import FreqBadge from './FreqBadge.vue'
import SpeakButton from './SpeakButton.vue'

const props = defineProps<{ card: Card; detail?: CardDetail; flipped: boolean }>()
const emit = defineEmits<{ (e: 'flip'): void }>()

const hasDetail = computed(() => !!props.detail && props.detail.meanings.length > 0)

// Flatten definitions across parts of speech for the horizontal scroller.
const definitionCards = computed(() =>
  hasDetail.value
    ? props.detail!.meanings.flatMap((m) =>
        m.definitions.map((d) => ({ pos: m.pos, en: d.en, si: d.si })),
      )
    : [],
)
// POS groups that actually have example sentences.
const exampleGroups = computed(() =>
  hasDetail.value ? props.detail!.meanings.filter((m) => m.examples.length > 0) : [],
)
</script>

<template>
  <div class="perspective-1000 w-full select-none" @click="emit('flip')">
    <div
      class="preserve-3d relative h-[clamp(25rem,66svh,44rem)] w-full transition-transform duration-500"
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
          <div class="flex items-center gap-3">
            <h2 class="text-center text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
              {{ card.word }}
            </h2>
            <SpeakButton :text="card.word" size="md" />
          </div>
        </div>

        <p class="text-center text-sm text-slate-400 dark:text-slate-500">Tap to reveal the meaning</p>
      </div>

      <!-- BACK -->
      <div
        class="backface-hidden rotate-y-180 absolute inset-0 flex cursor-pointer flex-col rounded-3xl border border-indigo-200 bg-white p-5 shadow-xl shadow-indigo-200/40 dark:border-indigo-500/30 dark:bg-slate-900 dark:shadow-black/30"
      >
        <div class="mb-3 flex shrink-0 items-center justify-between">
          <div class="flex items-baseline gap-2">
            <span class="text-lg font-bold text-slate-800 dark:text-slate-100">{{ card.word }}</span>
            <span class="text-xs uppercase tracking-wide text-slate-400">{{ card.pos }}</span>
          </div>
          <RotateCcw class="h-4 w-4 text-slate-400" />
        </div>

        <!-- Rich back: example sentences first, then definitions -->
        <div v-if="hasDetail" class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <!-- Examples: vertical scroll -->
          <section v-if="exampleGroups.length">
            <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
              Examples
            </p>
            <div class="space-y-3">
              <div v-for="(m, gi) in exampleGroups" :key="gi">
                <p class="mb-1 text-[10px] uppercase tracking-wide text-slate-400 capitalize">{{ m.pos }}</p>
                <div
                  v-for="(ex, ei) in m.examples"
                  :key="ei"
                  class="mb-2 border-l-2 border-indigo-200 pl-3 dark:border-indigo-500/40"
                >
                  <div class="flex items-start gap-2">
                    <p class="flex-1 text-sm leading-snug text-slate-800 dark:text-slate-100">
                      {{ ex.en }}
                    </p>
                    <SpeakButton :text="ex.en" class="mt-0.5" />
                  </div>
                  <p class="font-sinhala text-xs leading-snug text-slate-500 dark:text-slate-400">
                    {{ ex.si }}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- Definitions: horizontal scroll -->
          <section class="shrink-0">
            <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
              Definitions
            </p>
            <div class="flex gap-3 overflow-x-auto pb-2" @click.stop>
              <div
                v-for="(d, i) in definitionCards"
                :key="i"
                class="flex w-56 shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60"
              >
                <span class="mb-1 inline-block w-fit rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-600 capitalize dark:bg-indigo-500/20 dark:text-indigo-300">
                  {{ d.pos }}
                </span>
                <p class="text-sm leading-snug text-slate-800 dark:text-slate-100">{{ d.en }}</p>
                <p class="font-sinhala mt-1.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
                  {{ d.si }}
                </p>
              </div>
            </div>
          </section>
        </div>

        <!-- Fallback back: Sinhala senses (for cards without rich detail) -->
        <div v-else class="flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-y-auto">
          <div class="rounded-2xl bg-indigo-50 px-4 py-4 text-center dark:bg-white/5">
            <div class="font-sinhala text-3xl font-bold text-indigo-700 dark:text-indigo-300">
              {{ card.senses[0].si }}
            </div>
            <p class="mt-1 text-sm italic text-slate-500 dark:text-slate-400">{{ card.senses[0].roman }}</p>
          </div>
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
      </div>
    </div>
  </div>
</template>
