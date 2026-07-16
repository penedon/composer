/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'virtual:licensed-song-examples' {
  import type { SongExample } from '@domain/examples/example.types'
  export const licensedSongExamples: SongExample[]
}
