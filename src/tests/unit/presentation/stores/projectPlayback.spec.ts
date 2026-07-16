import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createProject } from '@domain/project/project.factory'

const playback = vi.hoisted(() => ({
  playPhrase: vi.fn(async () => undefined),
  playSong: vi.fn(async () => 176 * 60 / 92),
  stop: vi.fn(async () => undefined),
}))

vi.mock('@main/application', () => ({
  composerApplication: {
    canUndo: false,
    canRedo: false,
    playback,
  },
}))

import { useProjectStore } from '@presentation/stores/project.store'

describe('project store song seeking', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    playback.playSong.mockClear()
    playback.playPhrase.mockClear()
    playback.stop.mockClear()
    setActivePinia(createPinia())
  })

  afterEach(() => vi.useRealTimers())

  it('starts playback from the exact beat selected in the tracker', async () => {
    const store = useProjectStore()
    store.project = createProject()

    await store.seekSong(8)

    expect(playback.stop).toHaveBeenCalledOnce()
    expect(playback.playSong).toHaveBeenCalledWith(store.project, 8)
    expect(store.songPlaybackPositionSeconds).toBeCloseTo(8 * 60 / 92)
    expect(store.playingSong).toBe(true)
  })

  it('publishes the live phrase-local beat during phrase playback', async () => {
    const store = useProjectStore()
    store.project = createProject()
    const phrase = store.project.phrases[0]!

    await store.playPhrase(phrase)
    vi.advanceTimersByTime(1000)

    expect(playback.playPhrase).toHaveBeenCalledOnce()
    expect(store.playingPhraseId).toBe(phrase.id)
    expect(store.phrasePlaybackPositionBeats).toBeCloseTo(92 / 60, 1)
  })
})
