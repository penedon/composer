// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { parseProject } from '@domain/project/project.migrations'
import { MidiFileExporter } from '@infrastructure/export/midi/MidiFileExporter'
import { createPaperConstellationsProject } from '@tests/fixtures/projects/paperConstellations.fixture'

describe('original complete-song reference assets', () => {
  it('keeps the checked-in JSON fixture synchronized with its factory', async () => {
    const expected = createPaperConstellationsProject()
    const text = await readFile(resolve(process.cwd(), 'test-assets/original-reference-songs/paper-constellations.composer.json'), 'utf8')
    expect(parseProject(JSON.parse(text))).toEqual(expected)
    expect(expected.phrases.every((phrase) => phrase.lyrics.length > 0)).toBe(true)
  })

  it('keeps the checked-in multitrack MIDI synchronized with the project', async () => {
    const project = createPaperConstellationsProject()
    const expected = new MidiFileExporter().export(project).bytes
    const actual = await readFile(resolve(process.cwd(), 'test-assets/original-reference-songs/paper-constellations.mid'))
    expect([...actual]).toEqual([...expected])
    expect(actual.subarray(0, 4).toString('ascii')).toBe('MThd')
    expect(actual.readUInt16BE(10)).toBe(project.tracks.length + 1)
  })
})
