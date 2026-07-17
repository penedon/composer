import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EmotionSemanticWheel from '@presentation/components/emotion/EmotionSemanticWheel/EmotionSemanticWheel.vue'
import { emotionFamilies, emotionTaxonomy } from '@domain/emotion/emotionTaxonomy'
import { emotionFamilyAngle, layoutEmotionNodes } from '@presentation/components/emotion/EmotionSemanticWheel/EmotionSemanticWheel.layout'
import type { FeaturedEmotion } from '@domain/project/project.types'

describe('EmotionSemanticWheel', () => {
  it('keeps every canonical emotion directly reachable on the map', () => {
    const wrapper = mount(EmotionSemanticWheel, { props: { modelValue: 'melancholy', focusedFamily: null } })

    expect(wrapper.findAll('[data-emotion-id]')).toHaveLength(emotionTaxonomy.length)
    for (const emotion of emotionTaxonomy) expect(wrapper.find(`[data-emotion-id="${emotion.id}"]`).exists()).toBe(true)
  })

  it('keeps every selectable sub-emotion at the outer edge', () => {
    const wrapper = mount(EmotionSemanticWheel, { props: { modelValue: 'longing', focusedFamily: null } })
    const emotions = wrapper.findAll('[data-emotion-id]')

    expect(emotions.every((emotion) => emotion.attributes('data-layout-zone') === 'edge')).toBe(true)
    expect(emotions.every((emotion) => Number(emotion.attributes('data-layout-radius')) >= 280)).toBe(true)
    const connectors = wrapper.findAll('.emotion-semantic-wheel__connection')
    expect(connectors.length).toBeGreaterThan(0)
    expect(connectors.every((connector) => connector.element.tagName.toLowerCase() === 'path')).toBe(true)
    expect(connectors.every((connector) => connector.attributes('data-layout-zone') === 'edge')).toBe(true)
    expect(connectors.every((connector) => Number(connector.attributes('data-min-radius')) > 207)).toBe(true)
    const nodeRadius = Number(emotions[0]?.attributes('data-layout-radius'))
    expect(connectors.every((connector) => nodeRadius - Number(connector.attributes('data-max-radius')) >= 32)).toBe(true)
    const center = wrapper.get('.emotion-semantic-wheel__center')
    expect(center.attributes('data-selected-emotion-id')).toBe('longing')
    expect(center.text()).toContain('Longing')
    expect(center.text()).toContain('Emotional makeup')
    expect(center.text()).toContain('Love70%')
    expect(center.text()).toContain('Sadness60%')
    expect(center.text()).toContain('Desire50%')
    expect(center.findAll('button')).toHaveLength(0)
    expect(center.findAll('[data-emotion-id]')).toHaveLength(0)
    expect(wrapper.find('.emotion-semantic-wheel__explanation').exists()).toBe(false)
  })

  it('represents a selected blend with a bridge to every contributing family', () => {
    const wrapper = mount(EmotionSemanticWheel, { props: { modelValue: 'longing', focusedFamily: null } })
    const longing = wrapper.get('[data-emotion-id="longing"]')

    expect(longing.attributes('aria-label')).toContain('Blended emotion')
    expect(longing.classes()).toContain('emotion-semantic-wheel__emotion--blend')
    expect(wrapper.findAll('.emotion-semantic-wheel__connection--selected')).toHaveLength(3)
  })

  it('connects every selected emotion to all of its parents and intensifies those families', async () => {
    const wrapper = mount(EmotionSemanticWheel, { props: { modelValue: null, focusedFamily: null } })

    for (const emotion of emotionTaxonomy) {
      await wrapper.setProps({ modelValue: emotion.id })
      const parents = emotionFamilies.filter((family) => (emotion.families[family] ?? 0) > 0)
      const selectedConnections = wrapper.findAll('.emotion-semantic-wheel__connection--selected')
      const highlightedSectors = wrapper.findAll('.emotion-semantic-wheel__family-sector--parent')
      const highlightedLabels = wrapper.findAll('.emotion-semantic-wheel__family--parent')

      expect(selectedConnections).toHaveLength(parents.length)
      expect(selectedConnections.map((connection) => connection.attributes('data-connection-family'))).toEqual(parents)
      expect(highlightedSectors.map((sector) => sector.attributes('data-family-id'))).toEqual(parents)
      expect(highlightedLabels).toHaveLength(parents.length)
      expect(wrapper.get('.emotion-semantic-wheel__center').attributes('data-selected-emotion-id')).toBe(emotion.id)
      expect(wrapper.get('.emotion-semantic-wheel__center').text()).toContain(emotion.name)
    }
  })

  it('keeps newly added sibling emotions on the outer radius within their family sector', () => {
    const additions: FeaturedEmotion[] = Array.from({ length: 10 }, (_, index) => ({
      id: `new-joy-${index}`,
      name: `New joy ${index}`,
      color: '#e2b84f',
      families: { joy: 1 },
    }))
    const radius = 286
    const layout = layoutEmotionNodes(additions, radius)
    const centerAngle = emotionFamilyAngle('joy')
    const angles = additions.map((emotion) => layout.get(emotion.id)?.angle)

    expect(new Set(angles).size).toBe(additions.length)
    for (const emotion of additions) {
      const position = layout.get(emotion.id)
      expect(position?.radius).toBe(radius)
      expect(Math.abs((position?.angle ?? 0) - centerAngle)).toBeLessThanOrEqual(16)
    }
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
