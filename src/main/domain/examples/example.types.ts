import type { CompositionProject } from '@domain/project/project.types'

export interface SongExample {
  id: string
  kind: 'original' | 'licensed-reference'
  availability: 'ready' | 'missing-assets'
  artist?: string
  missingAssets?: string[]
  theme: string
  summary: string
  steps: string[]
  project: CompositionProject
}
