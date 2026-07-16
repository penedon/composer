import { describe, expect, it } from 'vitest'

import { defaultInstrumentId, instrumentCatalog, instrumentIdForImportedMidi, instrumentsForRole } from '@domain/arrangement/instrumentCatalog'
import { gmDrumMap } from '@domain/arrangement/gmDrumMap'
import { registeredSamplerIds } from '@infrastructure/playback/sampler/samplerRegistry'

describe('instrument catalog', () => {
  it('has unique IDs and multiple choices for every role', () => {
    expect(new Set(instrumentCatalog.map((instrument) => instrument.id)).size).toBe(instrumentCatalog.length)
    for (const role of ['harmony', 'bass', 'rhythm', 'melody'] as const) {
      expect(instrumentsForRole(role).length).toBeGreaterThan(1)
      expect(instrumentsForRole(role).some((instrument) => instrument.id === defaultInstrumentId[role])).toBe(true)
    }
  })

  it('has a sampler implementation for every product instrument', () => {
    expect(registeredSamplerIds().sort()).toEqual(instrumentCatalog.map((instrument) => instrument.id).sort())
  })

  it('maps MIDI programs and percussion tracks to the closest supported sounds', () => {
    expect(instrumentIdForImportedMidi('harmony', { number: 0, name: 'acoustic grand piano' })).toBe('keys.soft-piano')
    expect(instrumentIdForImportedMidi('melody', { number: 27, name: 'electric guitar (clean)' })).toBe('guitar.electric-clean')
    expect(instrumentIdForImportedMidi('bass', { number: 38, name: 'synth bass' })).toBe('bass.synth')
    expect(instrumentIdForImportedMidi('rhythm', { number: 0, percussion: true })).toBe('kit.acoustic')
  })

  it('keeps the shared drum editor map on General MIDI pitches', () => {
    expect(gmDrumMap.map((piece) => piece.pitch)).toEqual([51, 49, 46, 42, 38, 37, 45, 36])
  })
})
