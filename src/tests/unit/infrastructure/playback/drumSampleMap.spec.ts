import { describe, expect, it } from 'vitest'

import { resolveDrumSampleName } from '@infrastructure/playback/sampler/drumSampleMap'

describe('sampled drum map', () => {
  it('maps General MIDI pitches to the named groups exposed by a sampled kit', () => {
    const groups = ['crash', 'hhclosed', 'hhopen', 'kick', 'ride', 'snare', 'stick', 'tom-l']
    expect([36, 37, 38, 42, 45, 46, 49, 51].map((pitch) => resolveDrumSampleName(groups, pitch))).toEqual([
      'kick', 'stick', 'snare', 'hhclosed', 'tom-l', 'hhopen', 'crash', 'ride',
    ])
  })

  it('uses a cymbal when a kit has no dedicated ride and preserves unsupported pitches', () => {
    expect(resolveDrumSampleName(['cymball'], 51)).toBe('cymball')
    expect(resolveDrumSampleName(['kick'], 60)).toBe(60)
  })
})
