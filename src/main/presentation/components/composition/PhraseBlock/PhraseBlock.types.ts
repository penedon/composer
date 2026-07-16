import type { ChordAnalysis } from '@domain/harmony/chords'
import type { Phrase } from '@domain/project/project.types'

export interface PhraseBlockProps {
  phrase: Phrase
  emotionName: string
  emotionColor: string
  active: boolean
  playing: boolean
  playbackBeat: number | null
  keySignature: string
}

export interface ChordSuggestionView extends ChordAnalysis {
  adventurous: boolean
}
