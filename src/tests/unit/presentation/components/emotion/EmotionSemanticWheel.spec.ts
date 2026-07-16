import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EmotionSemanticWheel from '@presentation/components/emotion/EmotionSemanticWheel/EmotionSemanticWheel.vue'
import { emotionTaxonomy } from '@domain/emotion/emotionTaxonomy'

describe('EmotionSemanticWheel', () => {
  it('keeps every canonical emotion directly reachable on the map', () => {
    const wrapper = mount(EmotionSemanticWheel, { props: { modelValue: 'melancholy', focusedFamily: null } })

    expect(wrapper.findAll('[data-emotion-id]')).toHaveLength(emotionTaxonomy.length)
    for (const emotion of emotionTaxonomy) expect(wrapper.find(`[data-emotion-id="${emotion.id}"]`).exists()).toBe(true)
  })

  it('represents a selected blend with a bridge to every contributing family', () => {
    const wrapper = mount(EmotionSemanticWheel, { props: { modelValue: 'longing', focusedFamily: null } })
    const longing = wrapper.get('[data-emotion-id="longing"]')

    expect(longing.attributes('aria-label')).toContain('Blended emotion')
    expect(longing.classes()).toContain('emotion-semantic-wheel__emotion--blend')
    expect(wrapper.findAll('.emotion-semantic-wheel__connection--selected')).toHaveLength(3)
  })

  it('selects emotions without confirming and prevents unavailable choices', async () => {
    const wrapper = mount(EmotionSemanticWheel, {
      props: { modelValue: 'melancholy', focusedFamily: null, unavailableEmotionIds: ['longing'] },
    })

    expect(wrapper.get('[data-emotion-id="longing"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-emotion-id="grief"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['grief'])
  })

  it('uses family buttons as reversible relationship filters', async () => {
    const wrapper = mount(EmotionSemanticWheel, { props: { modelValue: 'melancholy', focusedFamily: null } })
    const sadness = wrapper.get('button[aria-label^="Sadness:"]')

    await sadness.trigger('click')
    expect(wrapper.emitted('update:focusedFamily')?.at(-1)).toEqual(['sadness'])
    await wrapper.setProps({ focusedFamily: 'sadness' })
    await sadness.trigger('click')
    expect(wrapper.emitted('update:focusedFamily')?.at(-1)).toEqual([null])
  })
})
