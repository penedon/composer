import { describe, expect, it } from 'vitest'

import { buildSongPreview } from '@domain/playback/songPreview'
import { createProject } from '@domain/project/project.factory'

describe('song preview projection', () => {
  it('places composed events inside the complete planned song timeline', () => {
    const preview = buildSongPreview(createProject())
    expect(preview.events[0]?.beat).toBe(16)
    expect(new Set(preview.events.map((event) => event.role))).toEqual(new Set(['harmony', 'bass', 'rhythm']))
    expect(preview.totalBeats).toBe(176)
    expect(preview.sections).toEqual([
      { sectionId: 'intro', startBeat: 0, endBeat: 16, composedBeats: 0 },
      { sectionId: 'verse-1', startBeat: 16, endBeat: 48, composedBeats: 16 },
      { sectionId: 'pre', startBeat: 48, endBeat: 64, composedBeats: 0 },
      { sectionId: 'chorus', startBeat: 64, endBeat: 96, composedBeats: 0 },
      { sectionId: 'verse-2', startBeat: 96, endBeat: 128, composedBeats: 0 },
      { sectionId: 'bridge', startBeat: 128, endBeat: 144, composedBeats: 0 },
      { sectionId: 'final', startBeat: 144, endBeat: 176, composedBeats: 0 },
    ])
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
