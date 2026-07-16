import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createProject } from '@domain/project/project.factory'
import { SampledPlaybackEngine } from '@infrastructure/playback/sampler/SampledPlaybackEngine'

const { instrumentStart } = vi.hoisted(() => ({ instrumentStart: vi.fn(() => vi.fn()) }))

vi.mock('smplr', () => ({
  DrumMachine: vi.fn(() => ({ ready: Promise.resolve(), start: instrumentStart, stop: vi.fn(), dispose: vi.fn(), getGroupNames: () => ['kick'] })),
  Soundfont: vi.fn(() => ({ ready: Promise.resolve(), start: instrumentStart, stop: vi.fn(), dispose: vi.fn() })),
}))

describe('sampled playback track volume', () => {
  const setValueAtTime = vi.fn()
  const cancelScheduledValues = vi.fn()
  const setTargetAtTime = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    class FakeAudioContext {
      currentTime = 2
      destination = {} as AudioDestinationNode
      async resume() {}
      createGain() {
        return {
          gain: { setValueAtTime, cancelScheduledValues, setTargetAtTime },
          connect: vi.fn(),
        } as unknown as GainNode
      }
    }
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
  })

  it('routes a playing track through a live gain and changes it without rescheduling MIDI velocity', async () => {
    const project = createProject()
    const rhythm = project.tracks.find((track) => track.role === 'rhythm')!
    project.sections = [project.sections[0]!]
    project.phrases = []
    project.tracks = [rhythm]
    project.sequenceClips = [{
      id: 'clip-rhythm',
      trackId: rhythm.id,
      sectionId: project.sections[0]!.id,
      sourceClipId: null,
      notes: [{ id: 'kick', pitch: 36, startBeat: 0, durationBeats: .25, velocity: 96 }],
    }]

    const engine = new SampledPlaybackEngine()
    await engine.playSong(project)
    engine.setTrackVolume(rhythm.id, .23)

    expect(setValueAtTime).toHaveBeenCalledWith(rhythm.volume, 2)
    expect(cancelScheduledValues).toHaveBeenCalledTimes(2)
    expect(cancelScheduledValues).toHaveBeenLastCalledWith(2)
    expect(setTargetAtTime).toHaveBeenCalledWith(.23, 2, .012)
    expect(instrumentStart).toHaveBeenCalledWith(expect.objectContaining({ velocity: 96 }))
  })
})
