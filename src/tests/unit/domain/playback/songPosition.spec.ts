import { describe, expect, it } from 'vitest'

import { buildSongPreview } from '@domain/playback/songPreview'
import { projectSongPhrasePlayback, projectSongPosition, projectSongSeekBeat } from '@domain/playback/songPosition'
import { createProject } from '@domain/project/project.factory'

describe('song position projection', () => {
  it('starts at the first planned section even when it is unwritten', () => {
    const project = createProject()
    const preview = buildSongPreview(project)
    const position = projectSongPosition(project, preview.sections, 0)

    expect(position?.section.id).toBe('intro')
    expect(position?.sectionBar).toBe(1)
    expect(position?.progress).toBe(0)
  })

  it('projects positions inside unwritten sections', () => {
    const project = createProject()
    const preview = buildSongPreview(project)
    const position = projectSongPosition(project, preview.sections, 80)

    expect(position?.section.id).toBe('chorus')
    expect(position?.sectionBar).toBe(5)
    expect(position?.progress).toBeCloseTo(20 / 44)
  })

  it('moves to the next playable section at an exact section boundary', () => {
    const project = createProject()
    project.phrases.push({
      ...project.phrases[0]!,
      id: 'chorus-phrase',
      sectionId: 'chorus',
      order: 0,
      bars: 2,
    })
    const preview = buildSongPreview(project)
    const position = projectSongPosition(project, preview.sections, 64)

    expect(position?.section.id).toBe('chorus')
    expect(position?.sectionBar).toBe(1)
    expect(position?.progress).toBeCloseTo(16 / 44)
  })

  it('still projects the planned position when there are no phrases', () => {
    const project = createProject()
    project.phrases = []
    const preview = buildSongPreview(project)

    expect(projectSongPosition(project, preview.sections, 0)?.section.id).toBe('intro')
  })

  it('projects an exact section click into the corresponding preview beat', () => {
    const project = createProject()
    const preview = buildSongPreview(project)

    expect(projectSongSeekBeat(project, preview.sections, 'verse-1', .25)).toBe(24)
    expect(projectSongSeekBeat(project, preview.sections, 'verse-1', .5)).toBe(32)
  })

  it('maps the middle of the intro to exactly half of its duration', () => {
    const project = createProject()
    const preview = buildSongPreview(project)
    const beat = projectSongSeekBeat(project, preview.sections, 'intro', .5)

    expect(beat).toBe(8)
    expect(beat! * 60 / project.frame.tempo).toBeCloseTo((project.sections[0]!.bars * 4 * 60 / project.frame.tempo) / 2)
  })

  it('projects clicks in unwritten portions of the planned structure', () => {
    const project = createProject()
    const preview = buildSongPreview(project)

    expect(projectSongSeekBeat(project, preview.sections, 'verse-1', .75)).toBe(40)
    expect(projectSongSeekBeat(project, preview.sections, 'chorus', .5)).toBe(80)
  })

  it('projects a global song beat into the current phrase-local beat', () => {
    const project = createProject()

    expect(projectSongPhrasePlayback(project, 16)).toEqual({ phraseId: 'phrase-1', sectionId: 'verse-1', beat: 0 })
    expect(projectSongPhrasePlayback(project, 25.5)).toEqual({ phraseId: 'phrase-2', sectionId: 'verse-1', beat: 1.5 })
    expect(projectSongPhrasePlayback(project, 40)).toBeNull()
  })

  it('returns no phrase while the song is in an unwritten section', () => {
    const project = createProject()

    expect(projectSongPhrasePlayback(project, 4)).toBeNull()
    expect(projectSongPhrasePlayback(project, 80)).toBeNull()
  })
})
