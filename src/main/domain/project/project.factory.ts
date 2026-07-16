import type { CompositionProject, Phrase, SongSection } from './project.types'

const sections: SongSection[] = [
  ['intro', 'Intro', 4, '#60594d', 'Establish uncertainty'],
  ['verse-1', 'Verse 1', 8, '#45546b', 'Hope still feels possible'],
  ['pre', 'Pre-chorus', 4, '#625444', 'Let apprehension rise'],
  ['chorus', 'Chorus', 8, '#754a55', 'Admit the waiting is over'],
  ['verse-2', 'Verse 2', 8, '#45546b', 'The ritual becomes undeniable'],
  ['bridge', 'Bridge', 4, '#584c68', 'Choose acceptance over waiting'],
  ['final', 'Final chorus', 8, '#754a55', 'Love remains, but hope is released'],
].map(([id, name, bars, color, narrativePurpose]) => ({
  id: String(id),
  name: String(name),
  bars: Number(bars),
  color: String(color),
  narrativePurpose: String(narrativePurpose),
  sourceSectionId: id === 'final' ? 'chorus' : null,
}))

const phrases: Phrase[] = [
  {
    id: 'phrase-1',
    sectionId: 'verse-1',
    order: 0,
    bars: 2,
    lyrics: 'Every evening I leave the hallway light on',
    chords: [
      { id: 'chord-1', symbol: 'Dm', beat: 0, duration: 4 },
      { id: 'chord-2', symbol: 'Bb', beat: 4, duration: 4 },
    ],
    emotionId: 'melancholy',
    rhythm: 'Slow pulse',
    dynamics: 'Restrained',
    instrumental: false,
  },
  {
    id: 'phrase-2',
    sectionId: 'verse-1',
    order: 1,
    bars: 2,
    lyrics: 'I still set the table like you might come home',
    chords: [
      { id: 'chord-3', symbol: 'Dm', beat: 0, duration: 3 },
      { id: 'chord-4', symbol: 'Bb', beat: 3, duration: 3 },
      { id: 'chord-5', symbol: 'A7', beat: 6, duration: 2 },
    ],
    emotionId: 'longing',
    rhythm: 'Slow pulse',
    dynamics: 'Growing',
    instrumental: false,
  },
]

export function createProject(id = 'the-doorway', title = 'The Doorway'): CompositionProject {
  const now = new Date().toISOString()
  return {
    schemaVersion: 1,
    id,
    title,
    createdAt: now,
    updatedAt: now,
    story: [
      { id: 'story-premise', label: 'Premise', text: 'Someone keeps preparing for a person who has already decided not to return. The ritual feels loving at first, then becomes an admission that the relationship is over.' },
      { id: 'story-conflict', label: 'Conflict', text: 'He wants the familiar gesture to mean hope. Instead, every night it proves that hope is becoming habit.' },
      { id: 'story-turn', label: 'Turning point', text: 'He finally turns the light off—not because he stopped loving her, but because he understands that waiting cannot bring her back.' },
    ],
    frame: { genre: 'Alternative rock', key: 'D minor', tempo: 92, meter: '4/4', groove: 'Slow pulse', references: '' },
    emotionPlan: {
      dominantFamily: 'sadness',
      featured: [
        { id: 'melancholy', name: 'Melancholy', families: { sadness: 0.9, love: 0.2 }, color: '#6687bd' },
        { id: 'longing', name: 'Longing', families: { sadness: 0.6, love: 0.7, desire: 0.5 }, color: '#d46f80' },
        { id: 'despair', name: 'Despair', families: { sadness: 1, fear: 0.25 }, color: '#c68b50' },
      ],
      points: sections.flatMap((section, sectionIndex) => [
        { sectionId: section.id, emotionId: 'melancholy', intensity: [25, 39, 47, 58, 66, 76, 72][sectionIndex] ?? 0 },
        { sectionId: section.id, emotionId: 'longing', intensity: [12, 23, 52, 73, 75, 81, 79][sectionIndex] ?? 0 },
        { sectionId: section.id, emotionId: 'despair', intensity: [5, 9, 16, 24, 39, 59, 88][sectionIndex] ?? 0 },
      ]),
    },
    sections,
    phrases,
    tracks: [
      { id: 'track-harmony', name: 'Harmony', role: 'harmony', instrument: 'Soft piano', volume: 0.82, muted: false, solo: false },
      { id: 'track-bass', name: 'Bass', role: 'bass', instrument: 'Upright bass', volume: 0.72, muted: false, solo: false },
      { id: 'track-rhythm', name: 'Rhythm', role: 'rhythm', instrument: 'Brush kit', volume: 0.68, muted: false, solo: false },
    ],
    alternatives: [],
    operations: [],
  }
}
