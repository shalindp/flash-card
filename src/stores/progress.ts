import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

interface CardProgress {
  correct: number
  incorrect: number
  lastSeen: number | null
}

interface StackProgress {
  correct: number
  incorrect: number
  completed: boolean
  bestAccuracy: number // 0-100, best single-session accuracy
}

export const useProgressStore = defineStore(
  'progress',
  () => {
    const byCard = ref<Record<number, CardProgress>>({})
    const byStack = ref<Record<number, StackProgress>>({})

    function cardEntry(id: number): CardProgress {
      if (!byCard.value[id]) byCard.value[id] = { correct: 0, incorrect: 0, lastSeen: null }
      return byCard.value[id]
    }
    function stackEntry(id: number): StackProgress {
      if (!byStack.value[id])
        byStack.value[id] = { correct: 0, incorrect: 0, completed: false, bestAccuracy: 0 }
      return byStack.value[id]
    }

    // Record a single answer during study.
    function answer(cardId: number, stackId: number, correct: boolean, when: number) {
      const c = cardEntry(cardId)
      const s = stackEntry(stackId)
      if (correct) {
        c.correct++
        s.correct++
      } else {
        c.incorrect++
        s.incorrect++
      }
      c.lastSeen = when
    }

    // Mark a study session of a stack as finished.
    function completeStack(stackId: number, correct: number, total: number) {
      const s = stackEntry(stackId)
      s.completed = true
      const acc = total ? Math.round((correct / total) * 100) : 0
      if (acc > s.bestAccuracy) s.bestAccuracy = acc
    }

    const totalCorrect = computed(() =>
      Object.values(byCard.value).reduce((n, c) => n + c.correct, 0),
    )
    const totalIncorrect = computed(() =>
      Object.values(byCard.value).reduce((n, c) => n + c.incorrect, 0),
    )
    const totalAnswered = computed(() => totalCorrect.value + totalIncorrect.value)
    const accuracy = computed(() =>
      totalAnswered.value ? Math.round((totalCorrect.value / totalAnswered.value) * 100) : 0,
    )
    // A card counts as "mastered" once answered correctly at least twice and
    // more often right than wrong.
    const masteredCount = computed(
      () =>
        Object.values(byCard.value).filter((c) => c.correct >= 2 && c.correct > c.incorrect).length,
    )

    const isStackCompleted = (id: number) => byStack.value[id]?.completed ?? false
    const stackAccuracy = (id: number) => byStack.value[id]?.bestAccuracy ?? 0

    function reset() {
      byCard.value = {}
      byStack.value = {}
    }

    return {
      byCard,
      byStack,
      answer,
      completeStack,
      totalCorrect,
      totalIncorrect,
      totalAnswered,
      accuracy,
      masteredCount,
      isStackCompleted,
      stackAccuracy,
      reset,
    }
  },
  { persist: true },
)
