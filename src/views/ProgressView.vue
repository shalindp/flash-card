<script setup lang="ts">
import { computed } from 'vue'
import { Check, X, Target, GraduationCap, Layers } from 'lucide-vue-next'
import { useCardsStore } from '../stores/cards'
import { useProgressStore } from '../stores/progress'
import { useTestsStore } from '../stores/tests'
import ProgressBar from '../components/ProgressBar.vue'

const cards = useCardsStore()
const progress = useProgressStore()
const tests = useTestsStore()

const studiedStacks = computed(() =>
  cards.stacks.filter((s) => progress.isStackCompleted(s.id)),
)
const unlockedLevels = computed(() => tests.unlockedGroups + 1)
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-extrabold">Your progress</h1>

    <!-- Headline stats -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <Target class="mb-2 h-5 w-5 text-indigo-500" />
        <div class="text-2xl font-extrabold">{{ progress.accuracy }}%</div>
        <div class="text-xs text-slate-400">accuracy</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <GraduationCap class="mb-2 h-5 w-5 text-emerald-500" />
        <div class="text-2xl font-extrabold">{{ progress.masteredCount }}</div>
        <div class="text-xs text-slate-400">words mastered</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <Check class="mb-2 h-5 w-5 text-emerald-500" />
        <div class="text-2xl font-extrabold">{{ progress.totalCorrect }}</div>
        <div class="text-xs text-slate-400">correct answers</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <X class="mb-2 h-5 w-5 text-rose-500" />
        <div class="text-2xl font-extrabold">{{ progress.totalIncorrect }}</div>
        <div class="text-xs text-slate-400">incorrect answers</div>
      </div>
    </div>

    <!-- Correct vs incorrect bar -->
    <div class="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div class="mb-2 flex items-center justify-between text-sm">
        <span class="font-semibold">Answers</span>
        <span class="text-slate-400">{{ progress.totalAnswered }} total</span>
      </div>
      <div class="flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          class="bg-emerald-500"
          :style="{ width: (progress.totalAnswered ? (progress.totalCorrect / progress.totalAnswered) * 100 : 0) + '%' }"
        />
        <div
          class="bg-rose-500"
          :style="{ width: (progress.totalAnswered ? (progress.totalIncorrect / progress.totalAnswered) * 100 : 0) + '%' }"
        />
      </div>
      <div class="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <Layers class="h-4 w-4" /> Level {{ unlockedLevels }} unlocked · {{ studiedStacks.length }} stacks studied
      </div>
    </div>

    <!-- Per-stack -->
    <h2 class="mt-8 mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      Stacks studied
    </h2>
    <div v-if="studiedStacks.length" class="space-y-3">
      <div
        v-for="s in studiedStacks"
        :key="s.id"
        class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
      >
        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="font-semibold">{{ s.title }}</span>
          <span class="font-medium text-slate-500">{{ progress.stackAccuracy(s.id) }}%</span>
        </div>
        <ProgressBar :value="progress.stackAccuracy(s.id)" :max="100" />
      </div>
    </div>
    <p v-else class="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
      No stacks studied yet. Start with English Vocabulary 1!
    </p>
  </div>
</template>
