import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
// Load the data file as an emitted asset URL (not inlined into the JS bundle),
// so the app bundle stays small even with thousands of cards.
import alldataUrl from '../data/alldata.json?url'
import type { Card, Stack } from '../types'
import { GROUP_SIZE, STACK_SIZE } from '../config'

export const useCardsStore = defineStore('cards', () => {
  const allCards = ref<Card[]>([])
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    const res = await fetch(alldataUrl)
    allCards.value = (await res.json()) as Card[]
    loaded.value = true
  }

  // Chunk the flat, frequency-ordered list into stacks of STACK_SIZE.
  const stacks = computed<Stack[]>(() => {
    const out: Stack[] = []
    for (let i = 0; i < allCards.value.length; i += STACK_SIZE) {
      const id = out.length + 1
      out.push({
        id,
        title: `English Vocabulary ${id}`,
        group: Math.floor((id - 1) / GROUP_SIZE),
        cards: allCards.value.slice(i, i + STACK_SIZE),
      })
    }
    return out
  })

  const totalCards = computed(() => allCards.value.length)
  const groupCount = computed(() => Math.ceil(stacks.value.length / GROUP_SIZE))

  const getStack = (id: number) => stacks.value.find((s) => s.id === id)
  const getCard = (id: number) => allCards.value.find((c) => c.id === id)

  // The (up to 3) stacks that belong to a group.
  const stacksInGroup = (group: number) => stacks.value.filter((s) => s.group === group)

  return { loaded, load, stacks, totalCards, groupCount, getStack, getCard, stacksInGroup }
})
