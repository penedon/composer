import type { CompositionProject } from '@domain/project/project.types'

export interface SongExample {
  id: string
  theme: string
  summary: string
  steps: string[]
  project: CompositionProject
}
