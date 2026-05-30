import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './style.css'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settings'
import { useCardsStore } from './stores/cards'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)
app.use(router)

// Apply the persisted dark-mode preference before first paint.
useSettingsStore().apply()

// Load the card data (a fetched asset) before mounting so views have it ready.
useCardsStore()
  .load()
  .finally(() => app.mount('#app'))
