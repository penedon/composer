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
    expect(migrated.schemaVersion).toBe(1)
    expect(migrated.title).toBe('Old song')
    expect(migrated.story.length).toBeGreaterThan(0)
  })
})
