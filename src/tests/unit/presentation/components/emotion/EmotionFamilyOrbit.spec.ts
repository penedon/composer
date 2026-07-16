import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EmotionFamilyOrbit from '@presentation/components/emotion/EmotionFamilyOrbit/EmotionFamilyOrbit.vue'

describe('EmotionFamilyOrbit', () => {
  it('moves and selects families with arrow keys', async () => {
    const wrapper = mount(EmotionFamilyOrbit, { props: { modelValue: 'joy' } })
    const joy = wrapper.get('button[aria-label^="Joy:"]')

    await joy.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['love'])
  })

  it('exposes family descriptions and selection without relying on color', () => {
    const wrapper = mount(EmotionFamilyOrbit, { props: { modelValue: 'sadness' } })
    const sadness = wrapper.get('button[aria-label^="Sadness:"]')

    expect(sadness.attributes('role')).toBe('radio')
    expect(sadness.attributes('aria-checked')).toBe('true')
    expect(sadness.attributes('aria-label')).toContain('Loss, reflection, and heaviness')
  })
})
