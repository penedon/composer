import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 1420,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@main': fileURLToPath(new URL('./src/main', import.meta.url)),
      '@domain': fileURLToPath(new URL('./src/main/domain', import.meta.url)),
      '@application': fileURLToPath(new URL('./src/main/application', import.meta.url)),
      '@infrastructure': fileURLToPath(new URL('./src/main/infrastructure', import.meta.url)),
      '@presentation': fileURLToPath(new URL('./src/main/presentation', import.meta.url)),
      '@tests': fileURLToPath(new URL('./src/tests', import.meta.url)),
    },
  },
})
