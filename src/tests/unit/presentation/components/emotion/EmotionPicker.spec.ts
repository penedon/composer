import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'

import EmotionPicker from '@presentation/components/emotion/EmotionPicker/EmotionPicker.vue'
import { emotionTaxonomy } from '@domain/emotion/emotionTaxonomy'

const melancholy = emotionTaxonomy.find((emotion) => emotion.id === 'melancholy')!

describe('EmotionPicker', () => {
  it('keeps a featured-emotion choice pending until confirmation', async () => {
    const wrapper = mount(EmotionPicker, {
      attachTo: document.body,
      props: { mode: 'featured', currentFamily: 'sadness', currentEmotion: melancholy, slotNumber: 1 },
    })
    await nextTick()

    const grief = wrapper.findAll('button').find((button) => button.text().includes('Grief'))!
    await grief.trigger('click')
    expect(wrapper.emitted('confirmEmotion')).toBeUndefined()

    await wrapper.findAll('button').find((button) => button.text().includes('Use emotion'))!.trigger('click')
    expect(wrapper.emitted('confirmEmotion')?.[0]?.[0]).toMatchObject({ id: 'grief' })
    wrapper.unmount()
  })

  it('cancels without emitting a confirmed value', async () => {
    const wrapper = mount(EmotionPicker, {
      attachTo: document.body,
      props: { mode: 'family', currentFamily: 'sadness' },
    })
    await nextTick()

    await wrapper.findAll('button').find((button) => button.text() === 'Cancel')!.trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirmFamily')).toBeUndefined()
    wrapper.unmount()
  })
})
