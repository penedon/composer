import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'

import { createLicensedReferenceExample, loadLicensedReferenceExamples } from '../../../../scripts/licensed-reference-examples'

describe('licensed reference examples', () => {
  it('maps exact local lyric lines and every MIDI note into an editable dev project', () => {
    const midi = new Midi()
    midi.header.setTempo(76)
    midi.header.timeSignatures.push({ ticks: 0, timeSignature: [4, 4] })
    midi.header.meta.push(
      { ticks: 0, type: 'marker', text: 'Intro' },
      { ticks: midi.header.ppq * 4, type: 'marker', text: 'Verse 1' },
      { ticks: midi.header.ppq * 8, type: 'marker', text: 'Verse 2' },
    )

    const guitar = midi.addTrack()
    guitar.name = 'Guitar'
    guitar.instrument.name = 'electric guitar (clean)'
    ;[[60, 64, 67], [65, 69, 72], [67, 71, 74]].forEach((pitches, sectionIndex) => {
      pitches.forEach((pitch) => guitar.addNote({ midi: pitch, ticks: midi.header.ppq * sectionIndex * 4, durationTicks: midi.header.ppq * 4, velocity: .8 }))
    })

    const drums = midi.addTrack()
    drums.name = 'Drums'
    drums.channel = 9
    drums.addNote({ midi: 36, ticks: midi.header.ppq * 4, durationTicks: 24, velocity: 1 })

    const example = createLicensedReferenceExample(
      { id: 'test-song', artist: 'Test Artist', title: 'Test Song' },
      '[Intro]\n[Verse 1]\nAn exact local line\n[Verse 2]\nAnother exact local line',
      midi.toArray(),
    )

    expect(example.kind).toBe('licensed-reference')
    expect(example.availability).toBe('ready')
    expect(example.project.frame).toMatchObject({ key: 'From imported MIDI', tempo: 76, meter: '4/4' })
    expect(example.project.sections.map((section) => section.name)).toEqual(['Intro', 'Verse 1', 'Verse 2'])
    expect(example.project.phrases.map((phrase) => phrase.lyrics)).toEqual(['', 'An exact local line', 'Another exact local line'])
    expect(example.project.phrases.flatMap((phrase) => phrase.chords.map((chord) => chord.symbol))).toEqual(['C', 'F', 'G'])
    expect(example.project.tracks.map((track) => track.role)).toEqual(['harmony', 'rhythm'])
    expect(example.project.tracks.map((track) => track.instrumentId)).toEqual(['guitar.electric-clean', 'kit.acoustic'])
    expect(example.project.sequenceClips.flatMap((clip) => clip.notes)).toHaveLength(10)
  })

  it('keeps the configured reference visible when its local assets are absent', async () => {
    const [example] = await loadLicensedReferenceExamples('/a/path/that/does/not/exist')

    expect(example).toMatchObject({
      id: 'scorpions-wind-of-change',
      availability: 'missing-assets',
      artist: 'Scorpions',
      project: { title: 'Wind of Change' },
    })
    expect(example?.missingAssets).toHaveLength(2)
  })

  it('infers harmonic context from a melody-only MIDI passage', () => {
    const midi = new Midi()
    midi.header.setTempo(80)
    const melody = midi.addTrack()
    melody.name = 'Melody voice'
    melody.instrument.name = 'english horn'
    ;[60, 64, 67].forEach((pitch, index) => melody.addNote({
      midi: pitch,
      ticks: midi.header.ppq * index,
      durationTicks: midi.header.ppq,
      velocity: .8,
    }))

    const example = createLicensedReferenceExample(
      { id: 'melody-only', artist: 'Test Artist', title: 'Melody Only' },
      '[Verse]\nA melodic phrase',
      midi.toArray(),
    )

    expect(example.project.phrases[0]?.chords[0]?.symbol).toBe('C')
  })
})
