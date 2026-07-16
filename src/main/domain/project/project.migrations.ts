import { createProject } from './project.factory'
import { compositionProjectSchema } from './project.schema'
import { migrateInstrumentId } from '@domain/arrangement/instrumentCatalog'
import type { ArrangementTrack, CompositionProject, TrackRole } from './project.types'

type LegacyTrack = Omit<ArrangementTrack, 'instrumentId'> & { instrumentId?: string; instrument?: string }
type LegacyProject = Partial<Omit<CompositionProject, 'schemaVersion' | 'sequenceClips' | 'tracks'>> & {
  schemaVersion?: number
  sequenceClips?: CompositionProject['sequenceClips']
  tracks?: LegacyTrack[]
  name?: string
}

function migrateTracks(tracks: LegacyTrack[] | undefined, fallback: ArrangementTrack[]): ArrangementTrack[] {
  return (tracks ?? fallback).map((trackValue) => {
    const track = trackValue as LegacyTrack
    return {
      id: track.id,
      name: track.name,
      role: track.role as TrackRole,
      instrumentId: migrateInstrumentId(track.instrumentId ?? track.instrument ?? '', track.role as TrackRole),
      volume: track.volume,
      muted: track.muted,
      solo: track.solo,
    }
  })
}

function migrateVersionZero(source: LegacyProject): CompositionProject {
  const base = createProject(source.id ?? 'imported-song', source.title ?? source.name ?? 'Imported song')
  return {
    ...base,
    ...source,
    schemaVersion: 3,
    sequenceClips: source.sequenceClips ?? [],
    tracks: migrateTracks(source.tracks, base.tracks),
    title: source.title ?? source.name ?? base.title,
    frame: { ...base.frame, ...source.frame },
    emotionPlan: { ...base.emotionPlan, ...source.emotionPlan },
  } as CompositionProject
}

function migrateVersionOne(source: LegacyProject): CompositionProject {
  const base = createProject(source.id ?? 'imported-song', source.title ?? source.name ?? 'Imported song')
  return { ...source, schemaVersion: 3, sequenceClips: source.sequenceClips ?? [], tracks: migrateTracks(source.tracks, base.tracks) } as CompositionProject
}

function migrateVersionTwo(source: LegacyProject): CompositionProject {
  const base = createProject(source.id ?? 'imported-song', source.title ?? source.name ?? 'Imported song')
  return { ...source, schemaVersion: 3, tracks: migrateTracks(source.tracks, base.tracks) } as CompositionProject
}

export function parseProject(value: unknown): CompositionProject {
  if (!value || typeof value !== 'object') throw new Error('Project file must contain a JSON object')
  const candidate = value as LegacyProject
  const migrated = candidate.schemaVersion === 3
    ? candidate as CompositionProject
    : candidate.schemaVersion === 2
      ? migrateVersionTwo(candidate)
    : candidate.schemaVersion === 1
      ? migrateVersionOne(candidate)
      : migrateVersionZero(candidate)
  return compositionProjectSchema.parse(migrated) as CompositionProject
}
