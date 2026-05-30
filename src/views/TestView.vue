<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Check, X, Trophy, ArrowRight, RotateCcw, HelpCircle } from 'lucide-vue-next'
import { useCardsStore } from '../stores/cards'
import { useTestsStore } from '../stores/tests'
import { GROUP_SIZE } from '../config'
import { shuffle } from '../utils/shuffle'
import { isCorrectAnswer } from '../utils/match'
import type { Card } from '../types'
import ProgressBar from '../components/ProgressBar.vue'

const props = defineProps<{ group: number }>()
const router = useRouter()
const cards = useCardsStore()
const tests = useTestsStore()

const unlocked = computed(() => tests.isGroupUnlocked(props.group))

// Mastery queue: cards cycle until each has been recalled correctly.
const queue = ref<Card[]>([])
const total = ref(0)
const masteredCount = ref(0)
const firstTryCorrect = ref(0)
const attemptedIds = new Set<number>()
const input = ref('')
const phase = ref<'asking' | 'correct' | 'wrong'>('asking')
const finished = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

const current = computed(() => queue.value[0])
const focusInput = () => nextTick(() => inputEl.value?.focus())

function start() {
  const pool = cards.stacksInGroup(props.group).flatMap((s) => s.cards)
  queue.value = shuffle(pool)
  total.value = pool.length
  masteredCount.value = 0
  firstTryCorrect.value = 0
  attemptedIds.clear()
  input.value = ''
  phase.value = 'asking'
  finished.value = false
  focusInput()
}

watch(() => props.group, start, { immediate: true })

function finish() {
  finished.value = true
  tests.recordTest(props.group, total.value, total.value, Date.now())
}

function submit() {
  if (phase.value !== 'asking' || !current.value) return
  if (!input.value.trim()) return
  const card = current.value
  const firstAttempt = !attemptedIds.has(card.id)
  if (isCorrectAnswer(input.value, card)) {
    phase.value = 'correct'
    if (firstAttempt) firstTryCorrect.value++
    masteredCount.value++
    window.setTimeout(() => {
      queue.value.shift() // mastered — remove permanently
      input.value = ''
      phase.value = 'asking'
      if (queue.value.length === 0) finish()
      else focusInput()
    }, 750)
  } else {
    attemptedIds.add(card.id)
    phase.value = 'wrong' // reveal the answer, wait for Continue
  }
}

// Wrong/skip: reveal then re-queue the word a few places back so it returns.
function markWrong() {
  if (phase.value !== 'asking' || !current.value) return
  attemptedIds.add(current.value.id)
  phase.value = 'wrong'
}

function continueAfterWrong() {
  const card = queue.value.shift()
  if (card) {
    const pos = Math.min(3, queue.value.length)
    queue.value.splice(pos, 0, card)
  }
  input.value = ''
  phase.value = 'asking'
  focusInput()
}

const accuracy = computed(() =>
  total.value ? Math.round((firstTryCorrect.value / total.value) * 100) : 0,
)
const nextLevel = computed(() => props.group + 2)
const firstStackOfNext = computed(() => (props.group + 1) * GROUP_SIZE + 1)
</script>

<template>
  <div>
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      @click="router.push('/')"
    >
      <ArrowLeft class="h-4 w-4" /> All stacks
    </button>

    <div
      v-if="!unlocked"
      class="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"
    >
      <h2 class="text-xl font-bold">Test locked</h2>
      <p class="mt-1 text-slate-500 dark:text-slate-400">Unlock this level first.</p>
    </div>

    <template v-else>
      <!-- In progress -->
      <div v-if="!finished && current" class="mx-auto max-w-xl">
        <div class="mb-5">
          <div class="mb-2 flex items-center justify-between">
            <h1 class="text-lg font-bold">Level {{ group + 1 }} Test</h1>
            <span class="text-sm font-medium text-slate-500 dark:text-slate-400">
              {{ masteredCount }} / {{ total }} mastered
            </span>
          </div>
          <ProgressBar :value="masteredCount" :max="total" />
          <p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Type the English word. Recall every word to unlock the next level.
          </p>
        </div>

        <!-- Prompt: the meaning -->
        <div
          class="mb-4 rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900"
        >
          <p class="text-xs uppercase tracking-wide text-slate-400">What is the English word?</p>
          <div class="mt-2 space-y-2">
            <div v-for="(s, i) in current.senses" :key="i">
              <p class="font-sinhala text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                {{ s.si }}
              </p>
              <p class="text-xs italic text-slate-500 dark:text-slate-400">
                {{ s.roman }}<span v-if="s.pos"> · {{ s.pos }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Answer input -->
        <form @submit.prevent="submit">
          <input
            ref="inputEl"
            v-model="input"
            type="text"
            :disabled="phase !== 'asking'"
            autocapitalize="off"
            autocorrect="off"
            autocomplete="off"
            spellcheck="false"
            placeholder="type the word…"
            class="w-full rounded-2xl border-2 px-4 py-3 text-center text-lg font-semibold text-slate-900 outline-none transition-colors dark:text-white"
            :class="
              phase === 'correct'
                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/15'
                : phase === 'wrong'
                  ? 'border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/15'
                  : 'border-slate-200 bg-white focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900'
            "
          />

          <!-- Feedback / actions -->
          <div class="mt-4">
            <div
              v-if="phase === 'correct'"
              class="flex items-center justify-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400"
            >
              <Check class="h-5 w-5" /> Correct!
            </div>

            <div v-else-if="phase === 'wrong'" class="text-center">
              <p class="flex items-center justify-center gap-2 font-semibold text-rose-500">
                <X class="h-5 w-5" /> The word was
                <span class="text-slate-900 dark:text-white">"{{ current.word }}"</span>
              </p>
              <button
                type="button"
                class="mt-3 w-full rounded-2xl bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
                @click="continueAfterWrong"
              >
                Continue
              </button>
            </div>

            <template v-else>
              <button
                type="submit"
                class="w-full rounded-2xl bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Check
              </button>
              <button
                type="button"
                class="mt-2 inline-flex w-full items-center justify-center gap-1.5 py-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                @click="markWrong"
              >
                <HelpCircle class="h-4 w-4" /> Skip / I don't know
              </button>
            </template>
          </div>
        </form>
      </div>

      <!-- Result -->
      <div
        v-else-if="finished"
        class="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div
          class="animate-pop mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
        >
          <Trophy class="h-8 w-8" />
        </div>
        <h2 class="text-2xl font-extrabold">All {{ total }} words recalled!</h2>
        <p class="mt-1 text-slate-500 dark:text-slate-400">Level {{ group + 1 }} complete.</p>

        <div class="my-6">
          <div class="text-5xl font-black text-emerald-500">{{ accuracy }}%</div>
          <div class="text-xs uppercase tracking-wide text-slate-400">recalled first try</div>
        </div>

        <div class="flex flex-col gap-3">
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
            @click="router.push(`/study/${firstStackOfNext}`)"
          >
            <ArrowRight class="h-5 w-5" /> Start Level {{ nextLevel }}
          </button>
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            @click="router.push('/')"
          >
            <RotateCcw class="h-5 w-5" /> Back to stacks
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
