import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'virtual:licensed-song-examples': fileURLToPath(new URL('./src/tests/fixtures/licensedSongExamples.empty.ts', import.meta.url)),
      '@main': fileURLToPath(new URL('./src/main', import.meta.url)),
      '@domain': fileURLToPath(new URL('./src/main/domain', import.meta.url)),
      '@application': fileURLToPath(new URL('./src/main/application', import.meta.url)),
      '@infrastructure': fileURLToPath(new URL('./src/main/infrastructure', import.meta.url)),
      '@presentation': fileURLToPath(new URL('./src/main/presentation', import.meta.url)),
      '@tests': fileURLToPath(new URL('./src/tests', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup/vitest.setup.ts'],
    include: ['src/tests/{unit,integration}/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/main/**/*.{ts,vue}'],
    },
  },
})
