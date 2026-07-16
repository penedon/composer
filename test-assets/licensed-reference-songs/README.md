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
