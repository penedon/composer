import type { BinaryFile, MidiExporter } from '@application/ports/ports'
import type { ArrangementTrack, CompositionProject } from '@domain/project/project.types'
import { chordMidiNotes } from '@domain/harmony/chords'
import { resolveSequenceClip } from '@domain/project/project.sequence'
import { instrumentLabel } from '@domain/arrangement/instrumentCatalog'

const PPQ = 480

function u32(value: number): number[] {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]
}

function u16(value: number): number[] {
  return [(value >>> 8) & 255, value & 255]
}

function variable(value: number): number[] {
  let buffer = value & 0x7f
  const bytes: number[] = []
  while ((value >>= 7)) { buffer <<= 8; buffer |= (value & 0x7f) | 0x80 }
  for (;;) {
    bytes.push(buffer & 0xff)
    if (buffer & 0x80) buffer >>= 8
    else break
  }
  return bytes
}

function chunk(name: string, data: number[]): number[] {
  return [...new TextEncoder().encode(name), ...u32(data.length), ...data]
}

function textEvent(type: number, text: string): number[] {
  const bytes = [...new TextEncoder().encode(text)]
  return [0, 0xff, type, ...variable(bytes.length), ...bytes]
}

function tempoTrack(project: CompositionProject): number[] {
  const microseconds = Math.round(60_000_000 / project.frame.tempo)
  const data = [
    ...textEvent(0x03, 'Composer tempo'),
    0, 0xff, 0x51, 0x03, (microseconds >>> 16) & 255, (microseconds >>> 8) & 255, microseconds & 255,
    0, 0xff, 0x58, 0x04, Number(project.frame.meter.split('/')[0] ?? 4), 2, 24, 8,
    0, 0xff, 0x2f, 0,
  ]
  return chunk('MTrk', data)
}

function musicalTrack(project: CompositionProject, track: ArrangementTrack, channel: number): number[] {
  const data: number[] = [...textEvent(0x03, `${track.name} · ${instrumentLabel(track.instrumentId)}`)]
  const events: Array<{ tick: number; bytes: number[] }> = []
  let sectionBeat = 0
  project.sections.forEach((section) => {
    const sequence = resolveSequenceClip(project, track.id, section.id)
    if (sequence) {
      sequence.clip.notes.forEach((note) => {
        const onTick = Math.round((sectionBeat + note.startBeat) * PPQ)
        const offTick = onTick + Math.max(1, Math.round(note.durationBeats * PPQ))
        events.push({ tick: onTick, bytes: [0x90 | channel, note.pitch, note.velocity] })
        events.push({ tick: offTick, bytes: [0x80 | channel, note.pitch, 0] })
      })
      sectionBeat += section.bars * 4
      return
    }
    const phrases = project.phrases.filter((phrase) => phrase.sectionId === section.id).sort((a, b) => a.order - b.order)
    let phraseBeat = sectionBeat
    phrases.forEach((phrase) => {
      if (track.role === 'rhythm') {
        for (let beat = 0; beat < phrase.bars * 4; beat += 1) {
          const tick = Math.round((phraseBeat + beat) * PPQ)
          events.push({ tick, bytes: [0x90 | channel, beat % 4 === 0 ? 36 : 42, 70] })
          events.push({ tick: tick + 80, bytes: [0x80 | channel, beat % 4 === 0 ? 36 : 42, 0] })
        }
      } else {
        phrase.chords.forEach((chord) => {
          const notes = chordMidiNotes(chord.symbol, track.role === 'bass' ? 2 : 4)
          const chosen = track.role === 'bass' ? notes.slice(0, 1) : notes
          const onTick = Math.round((phraseBeat + chord.beat) * PPQ)
          const offTick = onTick + Math.round(chord.duration * PPQ)
          chosen.forEach((note) => {
            events.push({ tick: onTick, bytes: [0x90 | channel, note, 76] })
            events.push({ tick: offTick, bytes: [0x80 | channel, note, 0] })
          })
        })
      }
      phraseBeat += phrase.bars * 4
    })
    sectionBeat += section.bars * 4
  })
  events.sort((a, b) => a.tick - b.tick || a.bytes[0]! - b.bytes[0]!)
  let previousTick = 0
  events.forEach((event) => {
    data.push(...variable(event.tick - previousTick), ...event.bytes)
    previousTick = event.tick
  })
  data.push(0, 0xff, 0x2f, 0)
  return chunk('MTrk', data)
}

export class MidiFileExporter implements MidiExporter {
  export(project: CompositionProject): BinaryFile {
    const tracks = [tempoTrack(project), ...project.tracks.map((track, index) => musicalTrack(project, track, Math.min(index, 15)))]
    const header = chunk('MThd', [...u16(1), ...u16(tracks.length), ...u16(PPQ)])
    return {
      name: `${project.id}.mid`,
      mimeType: 'audio/midi',
      bytes: new Uint8Array([...header, ...tracks.flat()]),
    }
  }
}
