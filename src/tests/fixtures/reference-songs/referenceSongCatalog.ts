export interface LicensedReferenceSong {
  id: string
  artist: string
  title: string
  lyricsPath: string
  midiPath: string
  assetPolicy: 'user-supplied-licensed'
}

export const licensedReferenceSongs: LicensedReferenceSong[] = [
  {
    id: 'coldplay-clocks',
    artist: 'Coldplay',
    title: 'Clocks',
    lyricsPath: 'test-assets/licensed-reference-songs/coldplay-clocks/lyrics.txt',
    midiPath: 'test-assets/licensed-reference-songs/coldplay-clocks/song.mid',
    assetPolicy: 'user-supplied-licensed',
  },
  {
    id: 'scorpions-wind-of-change',
    artist: 'Scorpions',
    title: 'Wind of Change',
    lyricsPath: 'test-assets/licensed-reference-songs/scorpions-wind-of-change/lyrics.txt',
    midiPath: 'test-assets/licensed-reference-songs/scorpions-wind-of-change/song.mid',
    assetPolicy: 'user-supplied-licensed',
  },
  {
    id: 'queen-dont-stop-me-now',
    artist: 'Queen',
    title: "Don't Stop Me Now",
    lyricsPath: 'test-assets/licensed-reference-songs/queen-dont-stop-me-now/lyrics.txt',
    midiPath: 'test-assets/licensed-reference-songs/queen-dont-stop-me-now/song.mid',
    assetPolicy: 'user-supplied-licensed',
  },
]
