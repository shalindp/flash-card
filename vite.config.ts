import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    watch: {
      // the scraper writes many files here at runtime; don't trigger reloads
      ignored: ['**/raw_data/**', '**/scripts/build/**'],
    },
  },
})
