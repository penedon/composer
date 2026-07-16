import { chordMidiNotes } from '@domain/harmony/chords'
import { resolveSequenceClip } from '@domain/project/project.sequence'
import type { CompositionProject, TrackRole } from '@domain/project/project.types'

export interface SongPreviewEvent {
  beat: number
  duration: number
  midiNotes: number[]
  trackId: string
  role: TrackRole
  instrumentId: string
  volume: number
  velocity: number
}

export interface SongPreview {
  events: SongPreviewEvent[]
  sections: SongPreviewSection[]
  totalBeats: number
}

export interface SongPreviewSection {
  sectionId: string
  startBeat: number
  endBeat: number
  composedBeats: number
}

export function buildSongPreview(project: CompositionProject): SongPreview {
  const soloed = project.tracks.filter((track) => track.solo && !track.muted)
  const activeTracks = soloed.length ? soloed : project.tracks.filter((track) => !track.muted)
  const events: SongPreviewEvent[] = []
  const sections: SongPreviewSection[] = []
  let cursorBeat = 0

  for (const section of project.sections) {
    const startBeat = cursorBeat
    const phrases = project.phrases
      .filter((phrase) => phrase.sectionId === section.id)
      .sort((left, right) => left.order - right.order)
    const phraseBeats = phrases.reduce((sum, phrase) => sum + phrase.bars * 4, 0)
    let sequenceBeats = 0

    for (const track of activeTracks) {
      const resolved = resolveSequenceClip(project, track.id, section.id)
      if (resolved) {
        for (const note of resolved.clip.notes) {
          events.push({
            beat: startBeat + note.startBeat,
            duration: note.durationBeats,
            midiNotes: [note.pitch],
            trackId: track.id,
            role: track.role,
            instrumentId: track.instrumentId,
            volume: track.volume,
            velocity: note.velocity,
          })
          sequenceBeats = Math.max(sequenceBeats, note.startBeat + note.durationBeats)
        }
        continue
      }

      let phraseCursorBeat = 0
      for (const phrase of phrases) {
        if (track.role === 'rhythm') {
          for (let beat = 0; beat < phrase.bars * 4; beat += 1) {
            events.push({ beat: startBeat + phraseCursorBeat + beat, duration: .12, midiNotes: [beat % 4 === 0 ? 36 : 42], trackId: track.id, role: track.role, instrumentId: track.instrumentId, volume: track.volume, velocity: 70 })
          }
          phraseCursorBeat += phrase.bars * 4
          continue
        }

        for (const chord of phrase.chords) {
          const chordNotes = chordMidiNotes(chord.symbol, track.role === 'bass' ? 2 : track.role === 'melody' ? 5 : 4)
          const midiNotes = track.role === 'bass' ? chordNotes.slice(0, 1) : track.role === 'melody' ? chordNotes.slice(-1) : chordNotes
          events.push({ beat: startBeat + phraseCursorBeat + chord.beat, duration: chord.duration, midiNotes, trackId: track.id, role: track.role, instrumentId: track.instrumentId, volume: track.volume, velocity: 76 })
        }
        phraseCursorBeat += phrase.bars * 4
      }
    }
    cursorBeat += section.bars * 4
    sections.push({ sectionId: section.id, startBeat, endBeat: cursorBeat, composedBeats: Math.min(Math.max(phraseBeats, sequenceBeats), section.bars * 4) })
  }

  return { events, sections, totalBeats: cursorBeat }
}
