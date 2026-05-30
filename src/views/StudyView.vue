<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Check, X, Lock } from 'lucide-vue-next'
import { useCardsStore } from '../stores/cards'
import { useProgressStore } from '../stores/progress'
import { useTestsStore } from '../stores/tests'
import { GROUP_SIZE } from '../config'
import { shuffle } from '../utils/shuffle'
import type { Card } from '../types'
import FlashCard from '../components/FlashCard.vue'
import AnswerButtons from '../components/AnswerButtons.vue'
import ProgressBar from '../components/ProgressBar.vue'
import ResultSummary from '../components/ResultSummary.vue'

const props = defineProps<{ id: number }>()
const router = useRouter()
const cards = useCardsStore()
const progress = useProgressStore()
const tests = useTestsStore()

const stack = computed(() => cards.getStack(props.id))
const unlocked = computed(() => tests.isStackUnlocked(props.id))

const deck = ref<Card[]>([])
const index = ref(0)
const flipped = ref(false)
const correctCount = ref(0)
const finished = ref(false)
const feedback = ref<'correct' | 'wrong' | null>(null)
const locked = ref(false) // disables input during feedback

function start() {
  if (!stack.value) return
  deck.value = shuffle(stack.value.cards)
  index.value = 0
  flipped.value = false
  correctCount.value = 0
  finished.value = false
  feedback.value = null
  locked.value = false
}

watch(() => props.id, start, { immediate: true })

const current = computed(() => deck.value[index.value])

function onAnswer(correct: boolean) {
  if (locked.value || !current.value) return
  locked.value = true
  if (correct) correctCount.value++
  progress.answer(current.value.id, props.id, correct, Date.now())
  feedback.value = correct ? 'correct' : 'wrong'

  window.setTimeout(() => {
    feedback.value = null
    if (index.value + 1 >= deck.value.length) {
      finished.value = true
      progress.completeStack(props.id, correctCount.value, deck.value.length)
    } else {
      index.value++
      flipped.value = false
    }
    locked.value = false
  }, 650)
}

// At the end of the last stack in a group, point the user at the gating test.
const isLastInGroup = computed(() => props.id % GROUP_SIZE === 0)
const group = computed(() => tests.groupOf(props.id))
const nextLabel = computed(() => {
  if (isLastInGroup.value && !tests.hasPassed(group.value)) return 'Take the unlock test'
  if (cards.getStack(props.id + 1)) return 'Next stack'
  return undefined
})

function onNext() {
  if (isLastInGroup.value && !tests.hasPassed(group.value)) {
    router.push(`/test/${group.value}`)
  } else {
    router.push(`/study/${props.id + 1}`)
  }
}
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

    <!-- Locked -->
    <div
      v-if="!stack || !unlocked"
      class="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"
    >
      <Lock class="mx-auto mb-3 h-10 w-10 text-slate-400" />
      <h2 class="text-xl font-bold">This stack is locked</h2>
      <p class="mt-1 text-slate-500 dark:text-slate-400">
        Pass the previous group's test with 100% to unlock it.
      </p>
    </div>

    <template v-else>
      <!-- Header + progress -->
      <div v-if="!finished" class="mb-5">
        <div class="mb-2 flex items-center justify-between">
          <h1 class="text-lg font-bold">{{ stack.title }}</h1>
          <span class="text-sm font-medium text-slate-500 dark:text-slate-400">
            {{ index + 1 }} / {{ deck.length }}
          </span>
        </div>
        <ProgressBar :value="index + (flipped ? 1 : 0)" :max="deck.length" />
        <div class="mt-2 flex gap-4 text-xs font-medium">
          <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Check class="h-3.5 w-3.5" /> {{ correctCount }}
          </span>
          <span class="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400">
            <X class="h-3.5 w-3.5" /> {{ Math.max(0, index - correctCount) }}
          </span>
        </div>
      </div>

      <!-- Card + answer -->
      <div v-if="!finished && current" class="relative">
        <FlashCard :key="current.id" :card="current" :flipped="flipped" @flip="flipped = !flipped" />

        <!-- Feedback overlay -->
        <Transition name="fb">
          <div
            v-if="feedback"
            class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl"
            :class="feedback === 'correct' ? 'bg-emerald-500/15' : 'bg-rose-500/15'"
          >
            <span
              class="animate-pop grid h-20 w-20 place-items-center rounded-full text-white shadow-lg"
              :class="feedback === 'correct' ? 'bg-emerald-500' : 'bg-rose-500'"
            >
              <Check v-if="feedback === 'correct'" class="h-10 w-10" />
              <X v-else class="h-10 w-10" />
            </span>
          </div>
        </Transition>

        <div class="mt-6">
          <AnswerButtons :disabled="!flipped || locked" @answer="onAnswer" />
          <p v-if="!flipped" class="mt-3 text-center text-xs text-slate-400">
            Reveal the answer before grading yourself
          </p>
        </div>
      </div>

      <!-- Done -->
      <ResultSummary
        v-else-if="finished"
        :correct="correctCount"
        :total="deck.length"
        :next-label="nextLabel"
        @retry="start"
        @next="onNext"
      />
    </template>
  </div>
</template>

<style scoped>
.fb-enter-active {
  transition: opacity 0.15s ease;
}
.fb-leave-active {
  transition: opacity 0.25s ease;
}
.fb-enter-from,
.fb-leave-to {
  opacity: 0;
}
</style>
