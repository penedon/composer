import { describe, expect, it } from 'vitest'

import { licensedReferenceSongs } from '@tests/fixtures/reference-songs/referenceSongCatalog'

describe('licensed reference-song catalog', () => {
  it('registers the requested songs as user-supplied assets', () => {
    expect(licensedReferenceSongs.map(({ artist, title }) => `${artist} — ${title}`)).toEqual([
      'Coldplay — Clocks',
      'Scorpions — Wind of Change',
      "Queen — Don't Stop Me Now",
    ])
    expect(licensedReferenceSongs.every((song) => song.assetPolicy === 'user-supplied-licensed')).toBe(true)
  })

  it('uses unique IDs and repo-relative asset paths', () => {
    expect(new Set(licensedReferenceSongs.map((song) => song.id)).size).toBe(licensedReferenceSongs.length)
    expect(licensedReferenceSongs.every((song) => song.lyricsPath.startsWith('test-assets/') && song.midiPath.endsWith('.mid'))).toBe(true)
  })
})
