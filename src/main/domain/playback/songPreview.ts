import { chordMidiNotes } from '@domain/harmony/chords'
import type { CompositionProject, TrackRole } from '@domain/project/project.types'

export interface SongPreviewEvent {
  beat: number
  duration: number
  midiNotes: number[]
  role: TrackRole
  volume: number
}

export interface SongPreview {
  events: SongPreviewEvent[]
  totalBeats: number
}

export function buildSongPreview(project: CompositionProject): SongPreview {
  const soloed = project.tracks.filter((track) => track.solo && !track.muted)
  const activeTracks = soloed.length ? soloed : project.tracks.filter((track) => !track.muted)
  const events: SongPreviewEvent[] = []
  let cursorBeat = 0

  for (const section of project.sections) {
    const phrases = project.phrases
      .filter((phrase) => phrase.sectionId === section.id)
      .sort((left, right) => left.order - right.order)

    for (const phrase of phrases) {
      for (const track of activeTracks) {
        if (track.role === 'rhythm') {
          for (let beat = 0; beat < phrase.bars * 4; beat += 1) {
            events.push({ beat: cursorBeat + beat, duration: .12, midiNotes: [beat % 4 === 0 ? 36 : 42], role: track.role, volume: track.volume })
          }
          continue
        }

        for (const chord of phrase.chords) {
          const chordNotes = chordMidiNotes(chord.symbol, track.role === 'bass' ? 2 : track.role === 'melody' ? 5 : 4)
          const midiNotes = track.role === 'bass' ? chordNotes.slice(0, 1) : track.role === 'melody' ? chordNotes.slice(-1) : chordNotes
          events.push({ beat: cursorBeat + chord.beat, duration: chord.duration, midiNotes, role: track.role, volume: track.volume })
        }
      }
      cursorBeat += phrase.bars * 4
    }
  }

  return { events, totalBeats: cursorBeat }
}
