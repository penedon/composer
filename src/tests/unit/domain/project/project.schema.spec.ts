import { describe, expect, it } from 'vitest'

import { createProject } from '@domain/project/project.factory'
import { parseProject } from '@domain/project/project.migrations'
import { compositionProjectSchema } from '@domain/project/project.schema'

describe('composition project schema', () => {
  it('round-trips a current project without losing creative data', () => {
    const project = createProject('test-song', 'Test song')
    expect(parseProject(JSON.parse(JSON.stringify(project)))).toEqual(project)
  })

  it('rejects invalid external data', () => {
    const project = createProject()
    expect(() => compositionProjectSchema.parse({ ...project, frame: { ...project.frame, tempo: 900 } })).toThrow()
    expect(() => parseProject(null)).toThrow('JSON object')
  })

  it('migrates the legacy unversioned name field', () => {
    const migrated = parseProject({ id: 'legacy', name: 'Old song' })
    expect(migrated.schemaVersion).toBe(3)
    expect(migrated.title).toBe('Old song')
    expect(migrated.story.length).toBeGreaterThan(0)
  })

  it('adds empty sequence clips when migrating version one projects', () => {
    const current = createProject()
    const legacy = { ...current, schemaVersion: 1, sequenceClips: undefined }
    const migrated = parseProject(legacy)
    expect(migrated.schemaVersion).toBe(3)
    expect(migrated.sequenceClips).toEqual([])
  })

  it('migrates version two instrument labels to stable catalog IDs', () => {
    const current = createProject()
    const legacy = {
      ...current,
      schemaVersion: 2,
      tracks: current.tracks.map((track) => ({
        id: track.id,
        name: track.name,
        role: track.role,
        volume: track.volume,
        muted: track.muted,
        solo: track.solo,
        instrument: track.role === 'rhythm' ? 'Acoustic kit' : 'Electric piano',
      })),
    }
    const migrated = parseProject(legacy)
    expect(migrated.tracks.find((track) => track.role === 'rhythm')?.instrumentId).toBe('kit.acoustic')
    expect(migrated.tracks.find((track) => track.role === 'harmony')?.instrumentId).toBe('keys.electric-piano')
  })
})
