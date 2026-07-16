import { describe, expect, it } from 'vitest'

import { emotionTaxonomy } from '@domain/emotion/emotionTaxonomy'
import { createProject } from '@domain/project/project.factory'
import { mergePhraseWithNext, moveSection, removeSection, replaceFeaturedEmotion, splitPhrase } from '@domain/project/project.operations'

describe('project operations', () => {
  it('moves a section without changing its emotion mappings', () => {
    const project = createProject()
    const moved = moveSection(project, 'verse-1', 1)
    expect(moved.sections[2]?.id).toBe('verse-1')
    expect(moved.emotionPlan.points).toEqual(project.emotionPlan.points)
  })

  it('replaces one featured emotion and retains curve intensity', () => {
    const project = createProject()
    const replacement = emotionTaxonomy.find((emotion) => emotion.id === 'grief')!
    const changed = replaceFeaturedEmotion(project, 0, replacement)
    expect(changed.emotionPlan.featured).toHaveLength(3)
    expect(changed.emotionPlan.points.some((point) => point.emotionId === 'grief')).toBe(true)
    expect(changed.phrases[0]?.emotionId).toBe('grief')
  })

  it('refuses duplicate featured emotions', () => {
    const project = createProject()
    expect(replaceFeaturedEmotion(project, 0, project.emotionPlan.featured[1]!)).toBe(project)
  })

  it('removes section-owned phrases and emotional points', () => {
    const changed = removeSection(createProject(), 'verse-1')
    expect(changed.sections.some((section) => section.id === 'verse-1')).toBe(false)
    expect(changed.phrases.some((phrase) => phrase.sectionId === 'verse-1')).toBe(false)
    expect(changed.emotionPlan.points.some((point) => point.sectionId === 'verse-1')).toBe(false)
  })

  it('splits and merges a phrase with beat-relative chords', () => {
    const project = createProject()
    const split = splitPhrase(project, 'phrase-1')
    expect(split.phrases.filter((phrase) => phrase.sectionId === 'verse-1')).toHaveLength(3)
    const merged = mergePhraseWithNext(split, 'phrase-1')
    expect(merged.phrases.filter((phrase) => phrase.sectionId === 'verse-1')).toHaveLength(2)
    expect(merged.phrases.find((phrase) => phrase.id === 'phrase-1')?.lyrics).toContain('hallway light on')
  })
})
