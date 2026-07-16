import { describe, expect, it } from 'vitest'

import { emotionFamilies, emotionTaxonomy, emotionsForFamily, primaryEmotionFamily } from '@domain/emotion/emotionTaxonomy'

describe('emotion taxonomy presentation', () => {
  it('makes every emotion reachable from each contributing family', () => {
    for (const emotion of emotionTaxonomy) {
      for (const family of emotionFamilies.filter((item) => (emotion.families[item] ?? 0) > 0)) {
        expect(emotionsForFamily(family).map((option) => option.emotion.id)).toContain(emotion.id)
      }
    }
  })

  it('classifies quiet sadness shades separately from substantial blends', () => {
    const sadness = emotionsForFamily('sadness')
    expect(sadness.find((option) => option.emotion.id === 'melancholy')?.kind).toBe('core')
    expect(sadness.find((option) => option.emotion.id === 'longing')?.kind).toBe('blend')
    expect(sadness.find((option) => option.emotion.id === 'alienation')?.kind).toBe('blend')
  })

  it('uses the preferred family only to break equal-weight ties', () => {
    const tied = { ...emotionTaxonomy[0]!, families: { joy: .7, wonder: .7 } }
    expect(primaryEmotionFamily(tied, 'wonder')).toBe('wonder')
    expect(primaryEmotionFamily(tied, 'fear')).toBe('joy')
  })
})
