import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'

import WorkspaceLayout from '@presentation/components/shell/WorkspaceLayout/WorkspaceLayout.vue'

async function mountLayout() {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] })
  await router.push('/')
  await router.isReady()
  return mount(WorkspaceLayout, {
    global: { plugins: [router] },
    slots: { rail: '<div>Navigation</div>', default: '<div>Workspace</div>', inspector: '<div>Context</div>' },
  })
}

describe('WorkspaceLayout', () => {
  beforeEach(() => localStorage.clear())

  it('contracts navigation independently while keeping the rail mounted', async () => {
    const wrapper = await mountLayout()

    await wrapper.get('button[aria-label="Contract composition navigation"]').trigger('click')

    expect(wrapper.classes()).toContain('workspace-layout--rail-collapsed')
    expect(wrapper.text()).toContain('Navigation')
    expect(wrapper.text()).toContain('Context')
    expect(localStorage.getItem('composer:shell:left-collapsed')).toBe('true')
  })

  it('hides and restores the contextual inspector independently', async () => {
    const wrapper = await mountLayout()

    await wrapper.get('button[aria-label="Hide composition context"]').trigger('click')

    expect(wrapper.classes()).toContain('workspace-layout--inspector-hidden')
    expect(wrapper.get('#composition-inspector').attributes('style')).toContain('display: none')
    expect(wrapper.get('button[aria-label="Show composition context"]')).toBeTruthy()
    expect(localStorage.getItem('composer:shell:inspector-visible')).toBe('false')

    await wrapper.get('button[aria-label="Show composition context"]').trigger('click')

    expect(wrapper.classes()).not.toContain('workspace-layout--inspector-hidden')
    expect(wrapper.get('#composition-inspector').attributes('style')).not.toContain('display: none')
  })
})
