<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Check, X, Trophy, AlertTriangle, RotateCcw, ArrowRight } from 'lucide-vue-next'
import { useCardsStore } from '../stores/cards'
import { useTestsStore } from '../stores/tests'
import { GROUP_SIZE } from '../config'
import { shuffle } from '../utils/shuffle'
import ProgressBar from '../components/ProgressBar.vue'

interface Option {
  si: string
  roman: string
  correct: boolean
}
interface Question {
  word: string
  pos: string
  options: Option[]
}

const props = defineProps<{ group: number }>()
const router = useRouter()
const cards = useCardsStore()
const tests = useTestsStore()

const OPTION_COUNT = 5
const unlocked = computed(() => tests.isGroupUnlocked(props.group))

const norm = (s: string) => s.replace(/[\s‌‍]/g, '')

const questions = ref<Question[]>([])
const qIndex = ref(0)
const selected = ref<number | null>(null)
const correctCount = ref(0)
const finished = ref(false)
const passed = ref(false)
const locked = ref(false)

function buildQuestions(): Question[] {
  const pool = cards.stacksInGroup(props.group).flatMap((s) => s.cards)
  return shuffle(pool).map((card) => {
    const correct: Option = {
      si: card.senses[0].si,
      roman: card.senses[0].roman,
      correct: true,
    }
    // distractors: other cards' primary sense, distinct Sinhala from the answer
    const seen = new Set([norm(correct.si)])
    const distractors: Option[] = []
    for (const c of shuffle(pool)) {
      if (distractors.length >= OPTION_COUNT - 1) break
      const si = c.senses[0].si
      if (seen.has(norm(si))) continue
      seen.add(norm(si))
      distractors.push({ si, roman: c.senses[0].roman, correct: false })
    }
    return { word: card.word, pos: card.pos, options: shuffle([correct, ...distractors]) }
  })
}

function start() {
  questions.value = buildQuestions()
  qIndex.value = 0
  selected.value = null
  correctCount.value = 0
  finished.value = false
  passed.value = false
  locked.value = false
}

watch(() => props.group, start, { immediate: true })

const current = computed(() => questions.value[qIndex.value])

function choose(i: number) {
  if (locked.value || selected.value !== null) return
  selected.value = i
  locked.value = true
  if (current.value.options[i].correct) correctCount.value++
  window.setTimeout(() => {
    if (qIndex.value + 1 >= questions.value.length) {
      finished.value = true
      passed.value = tests.recordTest(
        props.group,
        correctCount.value,
        questions.value.length,
        Date.now(),
      )
    } else {
      qIndex.value++
      selected.value = null
    }
    locked.value = false
  }, 900)
}

// Styling for an option once an answer has been picked.
function optionClass(opt: Option, i: number) {
  if (selected.value === null)
    return 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/50'
  if (opt.correct) return 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/15'
  if (i === selected.value) return 'border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/15'
  return 'border-slate-200 bg-white opacity-50 dark:border-slate-700 dark:bg-slate-900'
}

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
              {{ qIndex + 1 }} / {{ questions.length }}
            </span>
          </div>
          <ProgressBar :value="qIndex" :max="questions.length" />
          <p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Score 100% to unlock the next level.
          </p>
        </div>

        <!-- Prompt -->
        <div
          class="mb-5 rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900"
        >
          <p class="text-xs uppercase tracking-wide text-slate-400">What does this word mean?</p>
          <h2 class="mt-1 text-4xl font-extrabold text-slate-900 dark:text-white">{{ current.word }}</h2>
          <span class="text-xs uppercase tracking-wide text-slate-400">{{ current.pos }}</span>
        </div>

        <!-- Options -->
        <div class="grid gap-3">
          <button
            v-for="(opt, i) in current.options"
            :key="i"
            type="button"
            :disabled="selected !== null"
            class="flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all active:scale-[0.99]"
            :class="optionClass(opt, i)"
            @click="choose(i)"
          >
            <span class="min-w-0">
              <span class="block text-sm italic text-slate-500 dark:text-slate-400">{{ opt.roman }}</span>
              <span class="font-sinhala text-xl font-semibold text-slate-800 dark:text-slate-100">
                {{ opt.si }}
              </span>
            </span>
            <Check v-if="selected !== null && opt.correct" class="h-5 w-5 shrink-0 text-emerald-500" />
            <X
              v-else-if="selected === i && !opt.correct"
              class="h-5 w-5 shrink-0 text-rose-500"
            />
          </button>
        </div>
      </div>

      <!-- Result -->
      <div
        v-else-if="finished"
        class="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div
          class="animate-pop mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl text-white"
          :class="passed ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-rose-500 to-orange-500'"
        >
          <Trophy v-if="passed" class="h-8 w-8" />
          <AlertTriangle v-else class="h-8 w-8" />
        </div>
        <h2 class="text-2xl font-extrabold">{{ passed ? 'Passed!' : 'Not quite' }}</h2>
        <p class="mt-1 text-slate-500 dark:text-slate-400">
          {{ correctCount }} / {{ questions.length }} correct
        </p>
        <p v-if="!passed" class="mt-2 text-sm text-rose-500">
          You need 100% to unlock the next level. Review the stacks and try again.
        </p>

        <div class="mt-6 flex flex-col gap-3">
          <button
            v-if="passed"
            type="button"
            class="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
            @click="router.push(`/study/${firstStackOfNext}`)"
          >
            <ArrowRight class="h-5 w-5" /> Start Level {{ nextLevel }}
          </button>
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            @click="passed ? router.push('/') : start()"
          >
            <RotateCcw v-if="!passed" class="h-5 w-5" />
            {{ passed ? 'Back to stacks' : 'Retake test' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
