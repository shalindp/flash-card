<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNav from './components/AppNav.vue'
import { useTts } from './composables/useTts'

const route = useRoute()
// On study/test the bottom nav is hidden, so we don't need to reserve space for it.
const immersive = computed(() => ['study', 'test'].includes(route.name as string))

// Warm up the speech-synthesis voice list early.
onMounted(() => useTts().loadVoices())
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <AppNav />
    <main
      class="mx-auto w-full max-w-5xl px-4 pt-6 md:px-6 md:pb-12"
      :class="immersive ? 'pb-6' : 'pb-28'"
    >
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
