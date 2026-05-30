import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
// Load the data file as an emitted asset URL (not inlined into the JS bundle),
// so the app bundle stays small even with thousands of cards.
import alldataUrl from '../data/alldata.json?url'
import type { Card, CardDetail, Stack } from '../types'
import { GROUP_SIZE, STACK_SIZE } from '../config'

// Per-stack detail files (definitions + examples), loaded on demand as separate
// chunks so they don't bloat the initial payload.
const detailModules = import.meta.glob<{ default: Record<number, CardDetail> }>(
  '../data/details/*.json',
)

export const useCardsStore = defineStore('cards', () => {
  const allCards = ref<Card[]>([])
  const loaded = ref(false)

  // Rich card-back details, keyed by card id, filled in as stacks are opened.
  const details = ref<Record<number, CardDetail>>({})
  const loadedStacks = ref<Set<number>>(new Set())

  async function load() {
    if (loaded.value) return
    const res = await fetch(alldataUrl)
    allCards.value = (await res.json()) as Card[]
    loaded.value = true
  }

  // Load (once) the detail file for a stack, if one exists for it.
  async function loadStackDetails(stackId: number) {
    if (loadedStacks.value.has(stackId)) return
    const key = Object.keys(detailModules).find((k) => k.endsWith(`/${stackId}.json`))
    if (key) {
      const mod = await detailModules[key]()
      details.value = { ...details.value, ...mod.default }
    }
    loadedStacks.value = new Set(loadedStacks.value).add(stackId)
  }

  const getDetail = (cardId: number): CardDetail | undefined => details.value[cardId]

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

  return {
    loaded,
    load,
    loadStackDetails,
    getDetail,
    stacks,
    totalCards,
    groupCount,
    getStack,
    getCard,
    stacksInGroup,
  }
})
