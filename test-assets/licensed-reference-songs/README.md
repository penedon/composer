# Licensed reference-song assets

This folder registers integration cases for three commercial songs without committing or redistributing their copyrighted lyrics or MIDI arrangements.

Provide copies you are authorized to use at these exact paths:

```text
coldplay-clocks/lyrics.txt
coldplay-clocks/song.mid
scorpions-wind-of-change/lyrics.txt
scorpions-wind-of-change/song.mid
queen-dont-stop-me-now/lyrics.txt
queen-dont-stop-me-now/song.mid
```

Then run:

```sh
npm run test:licensed-references
```

The validator checks that each lyric file is non-empty and each MIDI file has a standard MIDI header. It never prints the supplied content. These asset files are ignored by Git.

Authorized-source starting points for **Wind of Change**:

- [Song Galaxy multitrack and fitting MIDI](https://songgalaxy.com/Multitrack/Scorpions/Wind-of-Change/CRG3966.html) — the product page offers the MIDI separately from the audio multitrack.
- [Musixmatch licensed lyrics display](https://www.musixmatch.com/lyrics/Scorpions/Wind-of-Change) — useful for verification, but it does not provide the required downloadable `lyrics.txt` file.

Do not commit either purchased or otherwise licensed asset. Confirm that your license permits this local development use.

## Development app example

`npm run dev` always shows **Wind of Change** in the Song examples area. Until both Scorpions files are present, its card lists the missing local paths and cannot be opened. Once supplied, the app imports every MIDI note as an editable arrangement sequence and every non-empty lyric line as a phrase. The reference is never added by `npm run build`, even when the local files exist.

For the best section mapping, format lyric headings on their own lines and wrap them in brackets:

```text
[Intro]
[Verse 1]
first lyric line...
second lyric line...
[Chorus]
...
```

MIDI marker or cue-point events take precedence for arrangement section boundaries. If the MIDI has no markers, lyric headings are distributed across the song as section boundaries; if neither source has section labels, the complete song is loaded as one section. Restart the development server after adding the files.
