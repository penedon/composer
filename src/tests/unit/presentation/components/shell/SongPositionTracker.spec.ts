import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import { createProject } from '@domain/project/project.factory'
import SongPositionTracker from '@presentation/components/shell/SongPositionTracker/SongPositionTracker.vue'
import { useProjectStore } from '@presentation/stores/project.store'

describe('SongPositionTracker', () => {
  it('seeks to the exact clicked position, including inside an unwritten section', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useProjectStore()
    store.project = createProject()
    const seek = vi.spyOn(store, 'seekSong').mockResolvedValue()
    const wrapper = mount(SongPositionTracker, { global: { plugins: [pinia] } })
    const chorus = wrapper.get('button[aria-label^="Chorus,"]')
    chorus.element.getBoundingClientRect = () => ({ left: 100, width: 200 }) as DOMRect

    await chorus.trigger('click', { clientX: 250 })

    expect(seek).toHaveBeenCalledOnce()
    expect(seek).toHaveBeenCalledWith(88)
  })
})
