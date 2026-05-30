<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles, ClipboardCheck, CheckCircle2, Lock } from 'lucide-vue-next'
import { useCardsStore } from '../stores/cards'
import { useProgressStore } from '../stores/progress'
import { useTestsStore } from '../stores/tests'
import StackTile from '../components/StackTile.vue'

const router = useRouter()
const cards = useCardsStore()
const progress = useProgressStore()
const tests = useTestsStore()

// Show every unlocked group plus the next (locked) one as a teaser.
const visibleGroupCount = computed(() =>
  Math.min(tests.unlockedGroups + 2, cards.groupCount),
)
const lockedRemaining = computed(() =>
  Math.max(0, cards.groupCount - visibleGroupCount.value),
)
const groups = computed(() =>
  Array.from({ length: visibleGroupCount.value }, (_, g) => ({
    index: g,
    stacks: cards.stacksInGroup(g),
    unlocked: tests.isGroupUnlocked(g),
  })),
)

function groupAllCompleted(g: number) {
  return cards.stacksInGroup(g).every((s) => progress.isStackCompleted(s.id))
}
const hasNextGroup = (g: number) => g + 1 < cards.groupCount
</script>

<template>
  <div>
    <!-- Hero -->
    <section
      class="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-6 text-white shadow-xl shadow-indigo-500/20 md:p-8"
    >
      <div class="flex items-center gap-2 text-sm font-medium text-white/80">
        <Sparkles class="h-4 w-4" /> Learn English the smart way
      </div>
      <h1 class="mt-2 text-3xl font-extrabold md:text-4xl">VocabFlow</h1>
      <p class="mt-1 max-w-lg text-white/85">
        The most common English words first — each with its Sinhala meaning. Master them in order
        and you'll understand everyday conversation and movies.
      </p>

      <div class="mt-6 grid grid-cols-3 gap-3">
        <div class="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <div class="text-2xl font-extrabold">{{ progress.masteredCount }}</div>
          <div class="text-[11px] uppercase tracking-wide text-white/75">words mastered</div>
        </div>
        <div class="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <div class="text-2xl font-extrabold">{{ progress.accuracy }}%</div>
          <div class="text-[11px] uppercase tracking-wide text-white/75">accuracy</div>
        </div>
        <div class="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
          <div class="text-2xl font-extrabold">{{ cards.totalCards }}</div>
          <div class="text-[11px] uppercase tracking-wide text-white/75">total words</div>
        </div>
      </div>
    </section>

    <!-- Groups -->
    <div class="space-y-8">
      <section v-for="grp in groups" :key="grp.index">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Level {{ grp.index + 1 }}
          </h2>
          <span
            v-if="tests.hasPassed(grp.index)"
            class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 class="h-4 w-4" /> Test passed
          </span>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StackTile
            v-for="s in grp.stacks"
            :key="s.id"
            :stack="s"
            :locked="!grp.unlocked"
          />
        </div>

        <!-- Test gate to unlock the next level -->
        <div v-if="hasNextGroup(grp.index) && grp.unlocked" class="mt-3">
          <div
            v-if="tests.hasPassed(grp.index)"
            class="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            <CheckCircle2 class="h-5 w-5" /> Level {{ grp.index + 2 }} unlocked.
          </div>
          <button
            v-else-if="groupAllCompleted(grp.index)"
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-700"
            @click="router.push(`/test/${grp.index}`)"
          >
            <ClipboardCheck class="h-5 w-5" /> Take the test to unlock Level {{ grp.index + 2 }}
          </button>
          <div
            v-else
            class="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
          >
            <Lock class="h-4 w-4" /> Finish all 3 stacks above, then take the 100% test to unlock the
            next level.
          </div>
        </div>
      </section>

      <p v-if="lockedRemaining" class="text-center text-sm text-slate-400">
        + {{ lockedRemaining }} more level{{ lockedRemaining > 1 ? 's' : '' }} to unlock
      </p>
    </div>
  </div>
</template>
