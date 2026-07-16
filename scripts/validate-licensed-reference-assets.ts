import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { licensedReferenceSongs } from '@tests/fixtures/reference-songs/referenceSongCatalog'

const missing: string[] = []
for (const song of licensedReferenceSongs) {
  try {
    const lyrics = await readFile(resolve(process.cwd(), song.lyricsPath), 'utf8')
    const midi = await readFile(resolve(process.cwd(), song.midiPath))
    if (!lyrics.trim()) throw new Error('lyrics file is empty')
    if (midi.subarray(0, 4).toString('ascii') !== 'MThd') throw new Error('MIDI header is invalid')
  } catch (error) {
    missing.push(`${song.artist} — ${song.title}: ${error instanceof Error ? error.message : 'unreadable assets'}`)
  }
}

if (missing.length) {
  throw new Error(`Licensed reference assets are incomplete:\n${missing.map((item) => `- ${item}`).join('\n')}\nSee test-assets/licensed-reference-songs/README.md.`)
}

console.log(`Validated ${licensedReferenceSongs.length} licensed reference songs without printing their content.`)
