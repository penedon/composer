import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { licensedReferenceSongs } from '@tests/fixtures/reference-songs/referenceSongCatalog'

const requestedIds = process.argv.slice(2)
const songs = requestedIds.length
  ? licensedReferenceSongs.filter((song) => requestedIds.includes(song.id))
  : licensedReferenceSongs

const unknownIds = requestedIds.filter((id) => !licensedReferenceSongs.some((song) => song.id === id))
if (unknownIds.length) throw new Error(`Unknown licensed reference song IDs: ${unknownIds.join(', ')}`)

const missing: string[] = []
for (const song of songs) {
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

console.log(`Validated ${songs.length} licensed reference song${songs.length === 1 ? ' without printing its content.' : 's without printing their content.'}`)
