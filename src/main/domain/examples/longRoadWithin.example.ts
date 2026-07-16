import { chordMidiNotes } from '@domain/harmony/chords'
import type { ChordEvent, CompositionProject, MidiNoteEvent, Phrase, SequenceClip, SongSection } from '@domain/project/project.types'

import type { SongExample } from './example.types'

const timestamp = '2026-07-16T12:00:00.000Z'

const sections: SongSection[] = [
  { id: 'intro', name: 'Intro', bars: 4, color: '#60594d', narrativePurpose: 'Begin alone, still carrying identities supplied by other people', sourceSectionId: null },
  { id: 'verse-1', name: 'Verse 1', bars: 8, color: '#45546b', narrativePurpose: 'Leave home and discover how much of the self was borrowed', sourceSectionId: null },
  { id: 'pre', name: 'Pre-chorus', bars: 4, color: '#625444', narrativePurpose: 'Let isolation become impossible to avoid', sourceSectionId: null },
  { id: 'chorus', name: 'Chorus', bars: 8, color: '#754a55', narrativePurpose: 'First recognition of an authentic inner voice', sourceSectionId: null },
  { id: 'verse-2', name: 'Verse 2', bars: 8, color: '#45546b', narrativePurpose: 'Learn that solitude can reveal rather than only remove', sourceSectionId: null },
  { id: 'chorus-variation', name: 'Chorus variation', bars: 8, color: '#754a55', narrativePurpose: 'Reframe loneliness as honest companionship with the self', sourceSectionId: 'chorus' },
  { id: 'bridge', name: 'Bridge', bars: 8, color: '#584c68', narrativePurpose: 'Name the values that survived the journey', sourceSectionId: null },
  { id: 'final-chorus', name: 'Final chorus', bars: 8, color: '#754a55', narrativePurpose: 'Return with self-knowledge instead of a finished answer', sourceSectionId: 'chorus' },
  { id: 'outro', name: 'Outro', bars: 4, color: '#60594d', narrativePurpose: 'Face home without becoming the old self again', sourceSectionId: 'intro' },
]

function chordEvents(id: string, symbols: string[]): ChordEvent[] {
  return symbols.map((symbol, index) => ({ id: `${id}-chord-${index + 1}`, symbol, beat: index * 4, duration: 4 }))
}

function phrase(id: string, sectionId: string, order: number, lyrics: string, symbols: string[], emotionId: string, dynamics: string, instrumental = false): Phrase {
  return { id, sectionId, order, bars: 4, lyrics, chords: chordEvents(id, symbols), emotionId, rhythm: 'Walking pulse', dynamics, instrumental }
}

const phrases: Phrase[] = [
  phrase('intro-1', 'intro', 0, 'A solitary guitar follows the sound of boots on an empty road.', ['Em', 'C', 'G', 'D'], 'alienation', 'Distant', true),
  phrase('verse-1a', 'verse-1', 0, 'I left in a borrowed coat with a pocket full of names', ['Em', 'C', 'G', 'D'], 'alienation', 'Restrained'),
  phrase('verse-1b', 'verse-1', 1, 'Every town reflected someone I was trying to become', ['Em', 'C', 'Am', 'B7'], 'yearning', 'Growing'),
  phrase('pre-1', 'pre', 0, 'Then the last familiar signal disappeared behind the rain', ['C', 'D', 'Em', 'Em'], 'alienation', 'Rising'),
  phrase('chorus-1', 'chorus', 0, 'On the long road with nobody beside me', ['G', 'D', 'Em', 'C'], 'yearning', 'Open'),
  phrase('chorus-2', 'chorus', 1, 'I heard my own voice underneath the turning wheels', ['G', 'D', 'C', 'D'], 'serenity', 'Open'),
  phrase('verse-2a', 'verse-2', 0, 'I slept beneath a water tower where the dry grass knew the wind', ['Em', 'C', 'G', 'D'], 'alienation', 'Intimate'),
  phrase('verse-2b', 'verse-2', 1, 'With no one there to name me I could choose what I would keep', ['Em', 'C', 'Am', 'B7'], 'yearning', 'Growing'),
  phrase('chorus-var-1', 'chorus-variation', 0, 'On the long road the silence walked beside me', ['G', 'D', 'Em', 'C'], 'yearning', 'Open'),
  phrase('chorus-var-2', 'chorus-variation', 1, 'It was never empty once I listened without fear', ['G', 'D', 'C', 'D'], 'serenity', 'Confident'),
  phrase('bridge-1', 'bridge', 0, 'I am not the plans that broke or praise I could not hold', ['Am', 'Em', 'C', 'G'], 'yearning', 'Building'),
  phrase('bridge-2', 'bridge', 1, 'I am the one who kept on walking and the promises I chose', ['Am', 'Em', 'D', 'D'], 'serenity', 'Full'),
  phrase('final-1', 'final-chorus', 0, 'Now the long road is a line I carry in me', ['G', 'D', 'Em', 'C'], 'serenity', 'Full'),
  phrase('final-2', 'final-chorus', 1, 'I know my name is made from every honest step', ['G', 'D', 'C', 'G'], 'serenity', 'Full'),
  phrase('outro-1', 'outro', 0, 'Morning finds me facing home, not finished, but finally my own.', ['Em', 'C', 'G', 'G'], 'serenity', 'Settling'),
]

interface TimedChord {
  symbol: string
  startBeat: number
  duration: number
}

function timedChords(sectionId: string): TimedChord[] {
  let phraseOffset = 0
  return phrases
    .filter((candidate) => candidate.sectionId === sectionId)
    .sort((left, right) => left.order - right.order)
    .flatMap((candidate) => {
      const events = candidate.chords.map((chord) => ({ symbol: chord.symbol, startBeat: phraseOffset + chord.beat, duration: chord.duration }))
      phraseOffset += candidate.bars * 4
      return events
    })
}

function note(id: string, pitch: number, startBeat: number, durationBeats: number, velocity: number): MidiNoteEvent {
  return { id, pitch, startBeat, durationBeats, velocity }
}

function harmonySequence(sectionId: string): MidiNoteEvent[] {
  const intimate = ['intro', 'verse-1', 'verse-2', 'outro'].includes(sectionId)
  const velocity = sectionId === 'intro' ? 54 : sectionId === 'outro' ? 50 : intimate ? 64 : sectionId === 'final-chorus' ? 92 : 80
  let eventIndex = 0
  return timedChords(sectionId).flatMap((chord) => {
    const chordNotes = chordMidiNotes(chord.symbol, 3).slice(0, 3)
    if (intimate) {
      const events: MidiNoteEvent[] = []
      for (let offset = 0; offset < chord.duration; offset += .5) {
        const pitch = chordNotes[Math.round(offset * 2) % chordNotes.length]!
        events.push(note(`sequence-harmony-${sectionId}-${eventIndex++}`, pitch, chord.startBeat + offset, .42, velocity + (offset % 2 === 0 ? 5 : 0)))
      }
      return events
    }

    const events: MidiNoteEvent[] = []
    for (let pulse = 0; pulse < chord.duration; pulse += 2) {
      chordNotes.forEach((pitch, chordIndex) => {
        events.push(note(`sequence-harmony-${sectionId}-${eventIndex++}`, pitch, chord.startBeat + pulse + chordIndex * .035, Math.min(1.8, chord.duration - pulse), velocity - chordIndex * 3))
      })
    }
    return events
  })
}

function bassSequence(sectionId: string): MidiNoteEvent[] {
  const sparse = ['intro', 'verse-1', 'outro'].includes(sectionId)
  const step = sparse ? 2 : 1
  const velocity = sectionId === 'intro' ? 48 : sectionId === 'outro' ? 52 : sparse ? 64 : sectionId === 'final-chorus' ? 94 : 78
  let eventIndex = 0
  return timedChords(sectionId).flatMap((chord) => {
    const chordNotes = chordMidiNotes(chord.symbol, 2)
    const root = chordNotes[0]!
    const fifth = chordNotes[2] ?? root + 7
    const events: MidiNoteEvent[] = []
    for (let offset = 0; offset < chord.duration; offset += step) {
      const pitch = offset / step % 2 === 0 ? root : fifth - 12
      events.push(note(`sequence-bass-${sectionId}-${eventIndex++}`, pitch, chord.startBeat + offset, step * .88, velocity + (offset % 4 === 0 ? 6 : 0)))
    }
    return events
  })
}

function drumSequence(section: SongSection): MidiNoteEvent[] {
  const totalBeats = section.bars * 4
  const events: MidiNoteEvent[] = []
  let eventIndex = 0
  const add = (pitch: number, beat: number, velocity: number, duration = .2): void => {
    events.push(note(`sequence-rhythm-${section.id}-${eventIndex++}`, pitch, beat, duration, velocity))
  }

  if (section.id === 'intro') {
    for (let beat = 8; beat < totalBeats; beat += 2) add(37, beat, beat % 4 === 0 ? 58 : 48)
    return events
  }

  if (section.id === 'outro') {
    for (let beat = 0; beat < totalBeats; beat += 2) add(51, beat, beat % 4 === 0 ? 58 : 46)
    add(36, 0, 66)
    return events
  }

  const lateEntry = section.id === 'verse-1' ? 16 : 0
  const full = ['chorus', 'chorus-variation', 'bridge', 'final-chorus'].includes(section.id)
  const baseVelocity = section.id === 'final-chorus' ? 102 : full ? 88 : 70
  if (full) add(49, 0, Math.min(127, baseVelocity + 14), .4)
  for (let barStart = lateEntry; barStart < totalBeats; barStart += 4) {
    const hatStep = full ? .5 : 1
    for (let offset = 0; offset < 4; offset += hatStep) add(full ? 42 : 51, barStart + offset, baseVelocity - (offset % 1 ? 16 : 8))
    add(36, barStart, baseVelocity + 4)
    add(36, barStart + (full ? 2.5 : 2), baseVelocity - 4)
    add(full ? 38 : 37, barStart + 1, baseVelocity + 2)
    add(full ? 38 : 37, barStart + 3, baseVelocity + 6)
  }
  if (section.id === 'bridge') {
    add(45, totalBeats - 2, 82)
    add(47, totalBeats - 1.5, 88)
    add(50, totalBeats - 1, 96)
  }
  return events
}

function melodySequence(sectionId: string): MidiNoteEvent[] {
  const velocity = sectionId === 'intro' ? 52 : sectionId === 'outro' ? 56 : sectionId === 'final-chorus' ? 98 : sectionId.includes('chorus') ? 88 : 72
  let eventIndex = 0
  let contour = 0
  return timedChords(sectionId).flatMap((chord) => {
    const chordNotes = chordMidiNotes(chord.symbol, 4)
    const events: MidiNoteEvent[] = []
    const step = sectionId === 'intro' || sectionId === 'outro' ? 2 : 1
    for (let offset = 0; offset < chord.duration; offset += step) {
      const contourIndex = [0, 1, 2, 1, 2, 0][contour++ % 6]!
      const pitch = chordNotes[contourIndex % chordNotes.length]!
      events.push(note(`sequence-melody-${sectionId}-${eventIndex++}`, pitch, chord.startBeat + offset, step * .82, velocity + (offset % 4 === 0 ? 7 : 0)))
    }
    return events
  })
}

function arrangementSequences(): SequenceClip[] {
  return sections.flatMap((section) => {
    const source = section.sourceSectionId
    return [
      { id: `sequence-harmony-${section.id}`, trackId: 'track-harmony', sectionId: section.id, sourceClipId: source ? `sequence-harmony-${source}` : null, notes: harmonySequence(section.id) },
      { id: `sequence-bass-${section.id}`, trackId: 'track-bass', sectionId: section.id, sourceClipId: source ? `sequence-bass-${source}` : null, notes: bassSequence(section.id) },
      { id: `sequence-rhythm-${section.id}`, trackId: 'track-rhythm', sectionId: section.id, sourceClipId: source ? `sequence-rhythm-${source}` : null, notes: drumSequence(section) },
      { id: `sequence-melody-${section.id}`, trackId: 'track-melody', sectionId: section.id, sourceClipId: source ? `sequence-melody-${source}` : null, notes: melodySequence(section.id) },
    ]
  })
}

export function createLongRoadWithinProject(): CompositionProject {
  return {
    schemaVersion: 2,
    id: 'example-long-road-within',
    title: 'The Long Road Within',
    createdAt: timestamp,
    updatedAt: timestamp,
    story: [
      { id: 'story-premise', label: 'Premise', text: 'A traveler leaves home alone believing distance will reveal who he is. At first he measures himself using names, expectations, and plans given to him by other people.' },
      { id: 'story-conflict', label: 'Conflict', text: 'The longer the journey becomes, the fewer familiar voices remain. Loneliness removes his borrowed identities before he has discovered anything to replace them.' },
      { id: 'story-turn', label: 'Turning point', text: 'In the silence, he notices the choices he continues making without praise or witnesses. Those choices—not a destination—show him the person he has become.' },
      { id: 'story-resolution', label: 'Resolution', text: 'He turns toward home without expecting to become his former self again. He is still unfinished, but now recognizes his own voice and values.' },
    ],
    frame: { genre: 'Indie folk rock', key: 'E minor', tempo: 84, meter: '4/4', groove: 'Walking pulse', references: 'Start sparse and close. Let drums and electric guitar enter as self-recognition replaces isolation.' },
    emotionPlan: {
      dominantFamily: 'sadness',
      featured: [
        { id: 'alienation', name: 'Alienation', families: { rejection: .8, sadness: .45 }, color: '#65736c' },
        { id: 'yearning', name: 'Yearning', families: { desire: .9, sadness: .35 }, color: '#b86f9e' },
        { id: 'serenity', name: 'Serenity', families: { joy: .8 }, color: '#75a88c' },
      ],
      points: sections.flatMap((section, index) => [
        { sectionId: section.id, emotionId: 'alienation', intensity: [62, 78, 91, 72, 68, 44, 36, 18, 12][index] ?? 0 },
        { sectionId: section.id, emotionId: 'yearning', intensity: [28, 45, 66, 82, 72, 76, 88, 74, 42][index] ?? 0 },
        { sectionId: section.id, emotionId: 'serenity', intensity: [6, 10, 8, 24, 34, 52, 61, 88, 94][index] ?? 0 },
      ]),
    },
    sections,
    phrases,
    tracks: [
      { id: 'track-harmony', name: 'Harmony', role: 'harmony', instrument: 'Nylon guitar', volume: .84, muted: false, solo: false },
      { id: 'track-bass', name: 'Bass', role: 'bass', instrument: 'Electric bass', volume: .7, muted: false, solo: false },
      { id: 'track-rhythm', name: 'Rhythm', role: 'rhythm', instrument: 'Acoustic kit', volume: .68, muted: false, solo: false },
      { id: 'track-melody', name: 'Melody guide', role: 'melody', instrument: 'Voice', volume: .78, muted: false, solo: false },
    ],
    sequenceClips: arrangementSequences(),
    alternatives: [{
      id: 'alternative-chorus-intimate',
      targetId: 'chorus-1',
      name: 'More intimate first chorus',
      phrase: phrase('chorus-1', 'chorus', 0, 'On the long road with the quiet close around me', ['Em', 'C', 'G', 'D'], 'yearning', 'Restrained'),
    }],
    operations: [
      { id: 'operation-1', description: 'Defined the narrative premise and turning point', createdAt: timestamp },
      { id: 'operation-2', description: 'Chose an indie folk frame and walking pulse', createdAt: timestamp },
      { id: 'operation-3', description: 'Selected alienation, yearning, and serenity', createdAt: timestamp },
      { id: 'operation-4', description: 'Shaped the emotional arc across nine sections', createdAt: timestamp },
      { id: 'operation-5', description: 'Wrote fifteen phrases with contextual harmony', createdAt: timestamp },
      { id: 'operation-6', description: 'Arranged four separate instrument tracks', createdAt: timestamp },
      { id: 'operation-7', description: 'Sequenced guitar, bass, drums, and melody across every section', createdAt: timestamp },
    ],
  }
}

export const longRoadWithinExample: SongExample = {
  id: 'long-road-within',
  theme: 'Knowing yourself after a long, lonely trip',
  summary: 'A complete indie-folk song that moves from alienation through yearning into a quiet recognition of the self.',
  steps: ['Story', 'Musical frame', 'Emotion palette', 'Emotional arc', 'Structure', 'Phrases & harmony', 'Arrangement & MIDI'],
  project: createLongRoadWithinProject(),
}
