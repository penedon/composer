import { describe, expect, it } from 'vitest'

import { createLongRoadWithinProject, longRoadWithinExample } from '@domain/examples/longRoadWithin.example'
import { compositionProjectSchema } from '@domain/project/project.schema'
import { MidiFileExporter } from '@infrastructure/export/midi/MidiFileExporter'

describe('The Long Road Within example', () => {
  it('contains a complete, schema-valid decision trail', () => {
    const project = createLongRoadWithinProject()
    expect(compositionProjectSchema.parse(project)).toEqual(project)
    expect(project.story).toHaveLength(4)
    expect(project.emotionPlan.featured).toHaveLength(3)
    expect(project.emotionPlan.points).toHaveLength(project.sections.length * 3)
    expect(project.operations.map((operation) => operation.description)).toContain('Wrote fifteen phrases with contextual harmony')
    expect(longRoadWithinExample.steps).toHaveLength(7)
  })

  it('fills every structural section with timed phrases and harmony', () => {
    const project = createLongRoadWithinProject()
    for (const section of project.sections) {
      const phrases = project.phrases.filter((phrase) => phrase.sectionId === section.id)
      expect(phrases.reduce((bars, phrase) => bars + phrase.bars, 0), section.name).toBe(section.bars)
      expect(phrases.every((phrase) => phrase.chords.length > 0), section.name).toBe(true)
    }
    expect(project.phrases.filter((phrase) => !phrase.instrumental).every((phrase) => phrase.lyrics.trim().length > 0)).toBe(true)
    expect(project.alternatives).toHaveLength(1)
  })

  it('exports tempo plus four separate MIDI tracks', () => {
    const project = createLongRoadWithinProject()
    const bytes = new MidiFileExporter().export(project).bytes
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('MThd')
    expect((bytes[10]! << 8) | bytes[11]!).toBe(project.tracks.length + 1)
  })
})
