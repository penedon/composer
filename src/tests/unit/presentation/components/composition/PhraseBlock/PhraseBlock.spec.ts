import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PhraseBlock from '@presentation/components/composition/PhraseBlock/PhraseBlock.vue'
import { createProject } from '@domain/project/project.factory'

function mountPhrase() {
  const phrase = structuredClone(createProject().phrases[0]!)
  return { phrase, wrapper: mount(PhraseBlock, { props: { phrase, emotionName: 'Melancholy', emotionColor: '#6687bd', active: true, playing: false, playbackBeat: null, keySignature: 'D minor' } }) }
}

describe('PhraseBlock', () => {
  it('emits lyric changes without owning canonical state', async () => {
    const { phrase, wrapper } = mountPhrase()
    await wrapper.get('textarea').setValue('A different artist-authored line')
    expect(wrapper.emitted('updateLyrics')?.at(-1)).toEqual(['A different artist-authored line'])
    expect(phrase.lyrics).not.toBe('A different artist-authored line')
  })

  it('plays and advances exactly once on Shift+Enter', async () => {
    const { wrapper } = mountPhrase()
    await wrapper.get('textarea').trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(wrapper.emitted('playNext')).toHaveLength(1)
  })

  it('auditions a suggestion before explicitly accepting it', async () => {
    const { wrapper } = mountPhrase()
    await wrapper.get('button[aria-label="Chord possibilities"]').trigger('click')
    await wrapper.get('button[aria-label^="Audition"]').trigger('click')
    expect(wrapper.emitted('auditionChord')).toHaveLength(1)
    expect(wrapper.emitted('addChord')).toBeUndefined()
  })

  it('keeps frequent actions available as named icon controls', async () => {
    const { wrapper } = mountPhrase()

    await wrapper.get('button[aria-label="Play phrase with lead-in"]').trigger('click')
    await wrapper.get('button[aria-label="Loop phrase"]').trigger('click')
    await wrapper.get('button[aria-label="Save phrase alternative"]').trigger('click')

    expect(wrapper.emitted('play')?.at(-1)).toEqual([true])
    expect(wrapper.emitted('loop')).toHaveLength(1)
    expect(wrapper.emitted('alternative')).toHaveLength(1)
    expect(wrapper.findAll('[role="tooltip"]').map((tooltip) => tooltip.text())).toContain('Play with lead-in')
  })

  it('presents Play as an icon with a descriptive tooltip', () => {
    const { wrapper } = mountPhrase()
    const play = wrapper.get('button[aria-label="Play phrase"]')

    expect(play.text()).toBe('Play phrase')
    expect(play.get('[role="tooltip"]').text()).toBe('Play phrase')
  })

  it('highlights the chord sounding at the current playback beat', async () => {
    const { phrase, wrapper } = mountPhrase()

    await wrapper.setProps({ playing: true, playbackBeat: 4.5 })

    expect(wrapper.get('button[aria-current="true"]').text()).toContain(phrase.chords[1]!.symbol)
    expect(wrapper.findAll('.phrase-block__chords button.is-playing')).toHaveLength(1)

    await wrapper.setProps({ playbackBeat: 8 })
    expect(wrapper.find('button[aria-current="true"]').exists()).toBe(false)
  })

  it('groups structural commands in a dismissible actions menu', async () => {
    const { wrapper } = mountPhrase()
    const trigger = wrapper.get('button[aria-label="More phrase actions"]')

    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[role="menu"]').isVisible()).toBe(true)

    await wrapper.get('[role="menuitem"]:nth-of-type(3)').trigger('click')
    expect(wrapper.emitted('split')).toHaveLength(1)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    await trigger.trigger('click')
    await trigger.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('hides supporting icons until an inactive phrase is selected', () => {
    const phrase = structuredClone(createProject().phrases[0]!)
    const wrapper = mount(PhraseBlock, { props: { phrase, emotionName: 'Melancholy', emotionColor: '#6687bd', active: false, playing: false, playbackBeat: null, keySignature: 'D minor' } })

    expect(wrapper.find('button[aria-label="Loop phrase"]').exists()).toBe(false)
    expect(wrapper.get('button[aria-label="Play phrase"]').attributes('aria-label')).toBe('Play phrase')
    expect(wrapper.get('button[aria-label="More phrase actions"]').attributes('aria-label')).toBe('More phrase actions')
  })
})
