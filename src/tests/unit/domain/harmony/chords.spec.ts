import { describe, expect, it } from 'vitest'

import { analyzeChord, chordMidiNotes, suggestNextChords } from '@domain/harmony/chords'

describe('tonal harmony guidance', () => {
  it('maps chord symbols to playable MIDI notes', () => {
    expect(chordMidiNotes('Dm')).toEqual([62, 65, 69])
    expect(chordMidiNotes('A7')).toEqual([69, 73, 76, 79])
  })

  it('explains tonic and dominant tension in key context', () => {
    expect(analyzeChord('Dm', 'D minor').tension).toBeLessThan(analyzeChord('A7', 'D minor').tension)
    expect(analyzeChord('A7', 'D minor').functionLabel).toContain('dominant')
  })

  it('returns possibilities without mutating inputs', () => {
    const current = 'Dm'
    const suggestions = suggestNextChords(current, 'D minor')
    expect(suggestions.some((item) => item.symbol === current)).toBe(false)
    expect(current).toBe('Dm')
  })
})
