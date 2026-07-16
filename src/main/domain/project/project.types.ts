export type EmotionFamily =
  | 'joy'
  | 'love'
  | 'sadness'
  | 'fear'
  | 'anger'
  | 'rejection'
  | 'wonder'
  | 'desire'

export interface NarrativeBlock {
  id: string
  label: string | null
  text: string
}

export interface MusicalFrame {
  genre: string
  key: string
  tempo: number
  meter: string
  groove: string
  references: string
}

export interface FeaturedEmotion {
  id: string
  name: string
  families: Partial<Record<EmotionFamily, number>>
  color: string
}

export interface EmotionPoint {
  sectionId: string
  emotionId: string
  intensity: number
}

export interface EmotionPlan {
  dominantFamily: EmotionFamily
  featured: FeaturedEmotion[]
  points: EmotionPoint[]
}

export interface SongSection {
  id: string
  name: string
  bars: number
  color: string
  narrativePurpose: string
  sourceSectionId: string | null
}

export interface ChordEvent {
  id: string
  symbol: string
  beat: number
  duration: number
}

export interface Phrase {
  id: string
  sectionId: string
  order: number
  bars: number
  lyrics: string
  chords: ChordEvent[]
  emotionId: string | null
  rhythm: string
  dynamics: string
  instrumental: boolean
}

export type TrackRole = 'harmony' | 'bass' | 'rhythm' | 'melody'

export interface ArrangementTrack {
  id: string
  name: string
  role: TrackRole
  instrument: string
  volume: number
  muted: boolean
  solo: boolean
}

export interface Alternative {
  id: string
  targetId: string
  name: string
  phrase: Phrase
}

export interface OperationRecord {
  id: string
  description: string
  createdAt: string
}

export interface CompositionProject {
  schemaVersion: 1
  id: string
  title: string
  createdAt: string
  updatedAt: string
  story: NarrativeBlock[]
  frame: MusicalFrame
  emotionPlan: EmotionPlan
  sections: SongSection[]
  phrases: Phrase[]
  tracks: ArrangementTrack[]
  alternatives: Alternative[]
  operations: OperationRecord[]
}

export interface ProjectSummary {
  id: string
  title: string
  updatedAt: string
}
