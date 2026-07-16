import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { longRoadWithinExample } from '@domain/examples/longRoadWithin.example'
import ExampleProjectCard from '@presentation/components/examples/ExampleProjectCard/ExampleProjectCard.vue'

describe('ExampleProjectCard', () => {
  it('summarizes every completed phase and emits one open intent', async () => {
    const wrapper = mount(ExampleProjectCard, { props: { example: longRoadWithinExample } })
    expect(wrapper.text()).toContain('The Long Road Within')
    expect(wrapper.findAll('[aria-label="Completed composition steps"] li')).toHaveLength(7)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('open')).toHaveLength(1)
  })
})
