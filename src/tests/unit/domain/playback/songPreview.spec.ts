import { describe, expect, it } from 'vitest'

import { buildSongPreview } from '@domain/playback/songPreview'
import { createProject } from '@domain/project/project.factory'

describe('song preview projection', () => {
  it('starts immediately at the first composed phrase and includes active track roles', () => {
    const preview = buildSongPreview(createProject())
    expect(preview.events[0]?.beat).toBe(0)
    expect(new Set(preview.events.map((event) => event.role))).toEqual(new Set(['harmony', 'bass', 'rhythm']))
    expect(preview.totalBeats).toBe(16)
  })

  it('honors solo and mute state without changing the project', () => {
    const project = createProject()
    project.tracks = project.tracks.map((track) => ({ ...track, solo: track.role === 'bass' }))
    const before = JSON.stringify(project)
    const preview = buildSongPreview(project)
    expect(new Set(preview.events.map((event) => event.role))).toEqual(new Set(['bass']))
    expect(JSON.stringify(project)).toBe(before)
  })
})
