import { defineStore } from 'pinia'
import { ref } from 'vue'
import { GROUP_SIZE } from '../config'

interface TestResult {
  score: number
  total: number
  date: number
}

export const useTestsStore = defineStore(
  'tests',
  () => {
    // Highest group index the user has access to. Levels 1 & 2 (groups 0 and 1,
    // i.e. stacks 1-6) are unlocked by default; passing group g's test unlocks
    // group g+1.
    const unlockedGroups = ref(1)
    const results = ref<Record<number, TestResult>>({})

    const groupOf = (stackId: number) => Math.floor((stackId - 1) / GROUP_SIZE)

    const isGroupUnlocked = (group: number) => group <= unlockedGroups.value
    const isStackUnlocked = (stackId: number) => isGroupUnlocked(groupOf(stackId))
    const hasPassed = (group: number) =>
      !!results.value[group] && results.value[group].score === results.value[group].total

    // Record a test attempt; a perfect score unlocks the next group.
    function recordTest(group: number, score: number, total: number, when: number) {
      const prev = results.value[group]
      if (!prev || score > prev.score) {
        results.value[group] = { score, total, date: when }
      }
      if (score === total) {
        unlockedGroups.value = Math.max(unlockedGroups.value, group + 1)
      }
      return score === total
    }

    function reset() {
      unlockedGroups.value = 1
      results.value = {}
    }

    return {
      unlockedGroups,
      results,
      groupOf,
      isGroupUnlocked,
      isStackUnlocked,
      hasPassed,
      recordTest,
      reset,
    }
  },
  { persist: true },
)
