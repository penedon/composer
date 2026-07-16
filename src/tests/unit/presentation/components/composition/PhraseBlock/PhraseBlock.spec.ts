import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PhraseBlock from '@presentation/components/composition/PhraseBlock/PhraseBlock.vue'
import { createProject } from '@domain/project/project.factory'

function mountPhrase() {
  const phrase = structuredClone(createProject().phrases[0]!)
  return { phrase, wrapper: mount(PhraseBlock, { props: { phrase, emotionName: 'Melancholy', emotionColor: '#6687bd', active: true, playing: false, keySignature: 'D minor' } }) }
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
    await wrapper.findAll('button').find((button) => button.text().includes('Chord possibilities'))!.trigger('click')
    await wrapper.get('button[aria-label^="Audition"]').trigger('click')
    expect(wrapper.emitted('auditionChord')).toHaveLength(1)
    expect(wrapper.emitted('addChord')).toBeUndefined()
  })
})
