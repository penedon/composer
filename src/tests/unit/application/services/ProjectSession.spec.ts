import { describe, expect, it, vi } from 'vitest'

import { ProjectSession } from '@application/services/ProjectSession'
import { createProject } from '@domain/project/project.factory'
import { updateFrame } from '@domain/project/project.operations'

describe('ProjectSession', () => {
  it('undoes and redoes exact canonical states', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const initial = createProject()
    const session = new ProjectSession(initial)
    const executed = session.execute('Change tempo', (project) => updateFrame(project, { tempo: 105 }))
    expect(executed.frame.tempo).toBe(105)
    expect(executed.operations.at(-1)?.description).toBe('Change tempo')
    expect(session.undo()).toEqual(initial)
    expect(session.redo()).toEqual(executed)
    vi.useRealTimers()
  })

  it('does not record a failed/no-op transform', () => {
    const initial = createProject()
    const session = new ProjectSession(initial)
    expect(session.execute('No change', (project) => project)).toBe(initial)
    expect(session.canUndo).toBe(false)
  })
})
