import { describe, expect, it } from 'vitest'

import { buildSectionTimelineLabels } from '@domain/structure/sectionTimelineLabels'
import type { SongSection } from '@domain/project/project.types'

function section(id: string, name: string): SongSection {
  return { id, name, bars: 4, color: '#000', narrativePurpose: '', sourceSectionId: null }
}

describe('section timeline labels', () => {
  it('numbers verses and chorus-family sections in song order', () => {
    const labels = buildSectionTimelineLabels([
      section('intro', 'Intro'), section('verse-1', 'Verse 1'), section('pre', 'Pre-chorus'),
      section('chorus', 'Chorus'), section('verse-2', 'Verse 2'), section('chorus-variation', 'Chorus variation'),
      section('bridge', 'Bridge'), section('final', 'Final chorus'), section('outro', 'Outro'),
    ])
    expect(labels.map(({ acronym }) => acronym)).toEqual(['I', 'V1', 'PC', 'C1', 'V2', 'C2', 'B', 'C3', 'O'])
  })

  it('uses compact initials for custom section names and numbers repeated types', () => {
    const labels = buildSectionTimelineLabels([section('hook-1', 'Post hook'), section('intro-1', 'Intro'), section('intro-2', 'Intro variation')])
    expect(labels.map(({ acronym }) => acronym)).toEqual(['PH', 'I1', 'I2'])
  })
})
