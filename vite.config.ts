import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { licensedReferenceAssetPaths, loadLicensedReferenceExamples } from './scripts/licensed-reference-examples'

const licensedExamplesModuleId = 'virtual:licensed-song-examples'
const resolvedLicensedExamplesModuleId = `\0${licensedExamplesModuleId}`

export default defineConfig(({ command, mode }) => ({
  plugins: [
    vue(),
    {
      name: 'dev-licensed-song-examples',
      resolveId(id) {
        return id === licensedExamplesModuleId ? resolvedLicensedExamplesModuleId : null
      },
      async load(id) {
        if (id !== resolvedLicensedExamplesModuleId) return null
        const examples = command === 'serve' && mode !== 'production'
          ? await loadLicensedReferenceExamples(fileURLToPath(new URL('.', import.meta.url)))
          : []
        return `export const licensedSongExamples = ${JSON.stringify(examples)}`
      },
      configureServer(server) {
        const root = fileURLToPath(new URL('.', import.meta.url))
        server.watcher.add(licensedReferenceAssetPaths.map((path) => resolve(root, path)))
      },
    },
  ],
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
}))
