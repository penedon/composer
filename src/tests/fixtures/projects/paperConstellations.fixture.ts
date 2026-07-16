import type { CompositionProject, SongSection } from '@domain/project/project.types'

const sections: SongSection[] = [
  { id: 'intro', name: 'Intro', bars: 4, color: '#60594d', narrativePurpose: 'The city is quiet before departure', sourceSectionId: null },
  { id: 'verse', name: 'Verse', bars: 8, color: '#45546b', narrativePurpose: 'Turn ordinary streets into a private map', sourceSectionId: null },
  { id: 'chorus', name: 'Chorus', bars: 8, color: '#754a55', narrativePurpose: 'Choose motion over certainty', sourceSectionId: null },
  { id: 'bridge', name: 'Bridge', bars: 4, color: '#584c68', narrativePurpose: 'Accept that the map is imaginary', sourceSectionId: null },
  { id: 'final', name: 'Final chorus', bars: 8, color: '#754a55', narrativePurpose: 'Move forward without needing proof', sourceSectionId: 'chorus' },
]

export function createPaperConstellationsProject(): CompositionProject {
  const timestamp = '2026-07-16T00:00:00.000Z'
  return {
    schemaVersion: 2,
    id: 'paper-constellations',
    title: 'Paper Constellations',
    createdAt: timestamp,
    updatedAt: timestamp,
    story: [
      { id: 'story-premise', label: 'Premise', text: 'A traveler invents constellations from streetlights to find the courage to leave a familiar city.' },
      { id: 'story-conflict', label: 'Conflict', text: 'The imagined map offers direction, but no guarantee that leaving is the right choice.' },
      { id: 'story-turn', label: 'Turning point', text: 'At dawn, the lights disappear and the traveler continues without them.' },
    ],
    frame: { genre: 'Alternative pop', key: 'C major', tempo: 108, meter: '4/4', groove: 'Straight eighths', references: 'Original regression fixture; no third-party composition material.' },
    emotionPlan: {
      dominantFamily: 'wonder',
      featured: [
        { id: 'anticipation', name: 'Anticipation', families: { desire: .7, joy: .3, fear: .15 }, color: '#b58f54' },
        { id: 'amazement', name: 'Amazement', families: { wonder: 1, joy: .25 }, color: '#5da5aa' },
        { id: 'serenity', name: 'Serenity', families: { joy: .8 }, color: '#75a88c' },
      ],
      points: sections.flatMap((section, index) => [
        { sectionId: section.id, emotionId: 'anticipation', intensity: [35, 58, 82, 61, 74][index] ?? 0 },
        { sectionId: section.id, emotionId: 'amazement', intensity: [22, 48, 73, 80, 86][index] ?? 0 },
        { sectionId: section.id, emotionId: 'serenity', intensity: [12, 20, 38, 55, 78][index] ?? 0 },
      ]),
    },
    sections,
    phrases: [
      { id: 'intro-1', sectionId: 'intro', order: 0, bars: 4, lyrics: 'Streetlights waking one by one', chords: [{ id: 'intro-c', symbol: 'C', beat: 0, duration: 8 }, { id: 'intro-am', symbol: 'Am', beat: 8, duration: 8 }], emotionId: 'anticipation', rhythm: 'Straight eighths', dynamics: 'Soft', instrumental: false },
      { id: 'verse-1', sectionId: 'verse', order: 0, bars: 4, lyrics: 'I fold the avenue into a paper sky', chords: [{ id: 'verse-c', symbol: 'C', beat: 0, duration: 4 }, { id: 'verse-em', symbol: 'Em', beat: 4, duration: 4 }, { id: 'verse-f', symbol: 'F', beat: 8, duration: 4 }, { id: 'verse-g', symbol: 'G7', beat: 12, duration: 4 }], emotionId: 'amazement', rhythm: 'Straight eighths', dynamics: 'Growing', instrumental: false },
      { id: 'verse-2', sectionId: 'verse', order: 1, bars: 4, lyrics: 'Every corner draws a star I get to name', chords: [{ id: 'verse2-am', symbol: 'Am', beat: 0, duration: 8 }, { id: 'verse2-f', symbol: 'F', beat: 8, duration: 4 }, { id: 'verse2-g', symbol: 'G7', beat: 12, duration: 4 }], emotionId: 'amazement', rhythm: 'Straight eighths', dynamics: 'Growing', instrumental: false },
      { id: 'chorus-1', sectionId: 'chorus', order: 0, bars: 4, lyrics: 'Paper constellations point beyond the morning', chords: [{ id: 'chorus-f', symbol: 'F', beat: 0, duration: 4 }, { id: 'chorus-g', symbol: 'G7', beat: 4, duration: 4 }, { id: 'chorus-c', symbol: 'C', beat: 8, duration: 8 }], emotionId: 'anticipation', rhythm: 'Driving', dynamics: 'Open', instrumental: false },
      { id: 'chorus-2', sectionId: 'chorus', order: 1, bars: 4, lyrics: 'I can take the road before the answer comes', chords: [{ id: 'chorus2-am', symbol: 'Am', beat: 0, duration: 4 }, { id: 'chorus2-f', symbol: 'F', beat: 4, duration: 4 }, { id: 'chorus2-g', symbol: 'G7', beat: 8, duration: 4 }, { id: 'chorus2-c', symbol: 'C', beat: 12, duration: 4 }], emotionId: 'serenity', rhythm: 'Driving', dynamics: 'Open', instrumental: false },
      { id: 'bridge-1', sectionId: 'bridge', order: 0, bars: 4, lyrics: 'Dawn erases every line I drew', chords: [{ id: 'bridge-am', symbol: 'Am', beat: 0, duration: 8 }, { id: 'bridge-f', symbol: 'F', beat: 8, duration: 8 }], emotionId: 'serenity', rhythm: 'Half-time', dynamics: 'Restrained', instrumental: false },
      { id: 'final-1', sectionId: 'final', order: 0, bars: 4, lyrics: 'Still my feet remember where to go', chords: [{ id: 'final-f', symbol: 'F', beat: 0, duration: 4 }, { id: 'final-g', symbol: 'G7', beat: 4, duration: 4 }, { id: 'final-c', symbol: 'C', beat: 8, duration: 8 }], emotionId: 'serenity', rhythm: 'Driving', dynamics: 'Full', instrumental: false },
      { id: 'final-2', sectionId: 'final', order: 1, bars: 4, lyrics: 'No proof above me, only open road', chords: [{ id: 'final2-am', symbol: 'Am', beat: 0, duration: 4 }, { id: 'final2-f', symbol: 'F', beat: 4, duration: 4 }, { id: 'final2-g', symbol: 'G7', beat: 8, duration: 4 }, { id: 'final2-c', symbol: 'C', beat: 12, duration: 4 }], emotionId: 'serenity', rhythm: 'Driving', dynamics: 'Full', instrumental: false },
    ],
    tracks: [
      { id: 'track-harmony', name: 'Harmony', role: 'harmony', instrument: 'Electric piano', volume: .82, muted: false, solo: false },
      { id: 'track-bass', name: 'Bass', role: 'bass', instrument: 'Electric bass', volume: .72, muted: false, solo: false },
      { id: 'track-rhythm', name: 'Rhythm', role: 'rhythm', instrument: 'Acoustic kit', volume: .7, muted: false, solo: false },
      { id: 'track-melody', name: 'Melody guide', role: 'melody', instrument: 'Voice', volume: .76, muted: false, solo: false },
    ],
    sequenceClips: [],
    alternatives: [],
    operations: [],
  }
}
