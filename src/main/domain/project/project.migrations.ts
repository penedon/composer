import { createProject } from './project.factory'
import { compositionProjectSchema } from './project.schema'
import type { CompositionProject } from './project.types'

type LegacyProject = Partial<Omit<CompositionProject, 'schemaVersion' | 'sequenceClips'>> & {
  schemaVersion?: number
  sequenceClips?: CompositionProject['sequenceClips']
  name?: string
}

function migrateVersionZero(source: LegacyProject): CompositionProject {
  const base = createProject(source.id ?? 'imported-song', source.title ?? source.name ?? 'Imported song')
  return {
    ...base,
    ...source,
    schemaVersion: 2,
    sequenceClips: source.sequenceClips ?? [],
    title: source.title ?? source.name ?? base.title,
    frame: { ...base.frame, ...source.frame },
    emotionPlan: { ...base.emotionPlan, ...source.emotionPlan },
  } as CompositionProject
}

function migrateVersionOne(source: LegacyProject): CompositionProject {
  return { ...source, schemaVersion: 2, sequenceClips: source.sequenceClips ?? [] } as CompositionProject
}

export function parseProject(value: unknown): CompositionProject {
  if (!value || typeof value !== 'object') throw new Error('Project file must contain a JSON object')
  const candidate = value as LegacyProject
  const migrated = candidate.schemaVersion === 2
    ? candidate as CompositionProject
    : candidate.schemaVersion === 1
      ? migrateVersionOne(candidate)
      : migrateVersionZero(candidate)
  return compositionProjectSchema.parse(migrated) as CompositionProject
}
