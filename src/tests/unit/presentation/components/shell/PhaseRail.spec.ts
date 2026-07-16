import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { createProject } from '@domain/project/project.factory'
import PhaseRail from '@presentation/components/shell/PhaseRail/PhaseRail.vue'
import { useProjectStore } from '@presentation/stores/project.store'

async function mountRail(path = '/projects/the-doorway/compose', collapsed = false) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useProjectStore()
  store.project = createProject()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/projects/:projectId/:phase', component: { template: '<div />' } }],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(PhaseRail, { props: { collapsed }, global: { plugins: [pinia, router] } })
  return { wrapper, router }
}

describe('PhaseRail', () => {
  beforeEach(() => localStorage.clear())

  it('keeps setup destinations visible while contracting their summaries', async () => {
    const { wrapper } = await mountRail()

    expect(wrapper.get('button[aria-controls="song-setup-links"]').attributes('aria-expanded')).toBe('false')
    expect(wrapper.text()).toContain('3 of 3 ready')
    expect(wrapper.findAll('#song-setup-links a')).toHaveLength(3)
    expect(wrapper.findAll('#song-setup-links a').map((link) => link.attributes('aria-label'))).toEqual(['Story', 'Frame', 'Emotions'])
    expect(wrapper.get('#song-setup-links').classes()).toContain('phase-rail__setup-links--compact')
    expect(wrapper.findAll('#song-setup-links small').every((summary) => !summary.isVisible())).toBe(true)

    await wrapper.get('button[aria-controls="song-setup-links"]').trigger('click')

    expect(wrapper.get('button[aria-controls="song-setup-links"]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('#song-setup-links').classes()).not.toContain('phase-rail__setup-links--compact')
    expect(wrapper.findAll('#song-setup-links small').every((summary) => summary.attributes('style') === '')).toBe(true)
    expect(wrapper.text()).toContain('D minor · 92 BPM · 4/4')
  })

  it('keeps the ordered setup links visible on a setup route', async () => {
    const { wrapper } = await mountRail('/projects/the-doorway/story')

    expect(wrapper.get('button[aria-controls="song-setup-links"]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('button[aria-controls="song-setup-links"]').attributes()).toHaveProperty('disabled')
    expect(wrapper.findAll('#song-setup-links a').map((link) => link.text())).toEqual(expect.arrayContaining(['1StorySomeone keeps preparing for a p…✓', '2FrameD minor · 92 BPM · 4/4✓', '3EmotionsMelancholy · Longing · Despair✓']))
  })

  it('keeps every destination available in the contracted icon rail', async () => {
    const { wrapper } = await mountRail('/projects/the-doorway/compose', true)

    const links = wrapper.findAll('.phase-rail__desktop a')
    expect(links).toHaveLength(7)
    expect(links.map((link) => link.attributes('aria-label'))).toEqual(['Story', 'Frame', 'Emotions', 'Structure', 'Compose', 'Arrange', 'Export'])
    expect(wrapper.get('a[aria-label="Compose"]').attributes('aria-current')).toBe('page')
  })
})
