// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { createProject } from '@domain/project/project.factory'
import { MidiFileExporter } from '@infrastructure/export/midi/MidiFileExporter'

function readU16(bytes: Uint8Array, offset: number): number { return (bytes[offset]! << 8) | bytes[offset + 1]! }
function readU32(bytes: Uint8Array, offset: number): number { return ((bytes[offset]! << 24) | (bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!) >>> 0 }

describe('MidiFileExporter', () => {
  it('writes a type-1 file with tempo plus separate instrument tracks', () => {
    const project = createProject()
    const before = JSON.stringify(project)
    const file = new MidiFileExporter().export(project)
    const bytes = file.bytes

    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('MThd')
    expect(readU32(bytes, 4)).toBe(6)
    expect(readU16(bytes, 8)).toBe(1)
    expect(readU16(bytes, 10)).toBe(project.tracks.length + 1)
    expect(readU16(bytes, 12)).toBe(480)
    expect(new TextDecoder().decode(bytes).match(/MTrk/g)).toHaveLength(project.tracks.length + 1)
    expect(new TextDecoder().decode(bytes)).toContain('Harmony · Soft piano')
    expect(JSON.stringify(project)).toBe(before)
  })

  it('writes explicit sequencer pitch and velocity data', () => {
    const project = createProject()
    project.sequenceClips = [{ id: 'clip-1', trackId: 'track-harmony', sectionId: 'intro', sourceClipId: null, notes: [{ id: 'note-1', pitch: 77, startBeat: 0, durationBeats: 1, velocity: 111 }] }]
    const bytes = [...new MidiFileExporter().export(project).bytes]
    expect(bytes.some((byte, index) => (byte & 0xf0) === 0x90 && bytes[index + 1] === 77 && bytes[index + 2] === 111)).toBe(true)
  })
})
