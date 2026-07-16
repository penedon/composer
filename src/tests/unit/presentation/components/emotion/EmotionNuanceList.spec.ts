import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EmotionNuanceList from '@presentation/components/emotion/EmotionNuanceList/EmotionNuanceList.vue'

describe('EmotionNuanceList', () => {
  it('shows core and blended shades for the selected family', () => {
    const wrapper = mount(EmotionNuanceList, { props: { family: 'sadness', modelValue: 'melancholy' } })

    expect(wrapper.text()).toContain('Core shades')
    expect(wrapper.text()).toContain('Melancholy')
    expect(wrapper.text()).toContain('Blended shades')
    expect(wrapper.text()).toContain('Longing')
  })

  it('keeps already-featured emotions visible but unavailable', () => {
    const wrapper = mount(EmotionNuanceList, { props: { family: 'sadness', modelValue: null, unavailableEmotionIds: ['longing'] } })
    const longing = wrapper.findAll('button').find((button) => button.text().includes('Longing'))!

    expect(longing.attributes()).toHaveProperty('disabled')
    expect(longing.text()).toContain('Already featured')
  })
})
