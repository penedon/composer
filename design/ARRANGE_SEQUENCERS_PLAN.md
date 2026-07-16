# Arrange sequencers product plan

## Outcome

Give every instrument track its own section-scoped MIDI sequencer inside Arrange. Melodic and harmonic instruments open a piano-roll editor; rhythm tracks open the same time grid with named drum parts instead of piano keys.

The feature should feel like Composer's next songwriting step, not a detached miniature DAW: the song structure stays visible, the current section remains the unit of work, and advanced MIDI detail is progressively disclosed.

Visual references:

- [`flows/02-arrange-sequencer-flow.svg`](./flows/02-arrange-sequencer-flow.svg)
- [`screens/22-arrange-piano-sequencer.svg`](./screens/22-arrange-piano-sequencer.svg)
- [`screens/23-arrange-drum-sequencer.svg`](./screens/23-arrange-drum-sequencer.svg)

## DAW research distilled

The proposal adapts a few stable conventions rather than copying any one DAW:

- **One grid grammar, different row headers.** Ableton's MIDI editor uses time horizontally and either a piano ruler or a list of drum pads vertically. Bitwig likewise switches the same note editor between piano and drum-style views. Composer should preserve one editing model and swap only the musical row vocabulary. Sources: [Ableton Live 12 MIDI editing](https://www.ableton.com/en/live-manual/12/editing-midi/), [Bitwig note-event editor](https://www.bitwig.com/userguide/latest/working_with_note_events/).
- **Clips/patterns are the editable unit.** Logic stores each step sequence in an independent pattern region or cell; FL Studio arranges patterns as clips. Composer's equivalent should be the intersection of one instrument track and one song section, because sections already anchor the product's writing flow. Sources: [Logic Pro Step Sequencer overview](https://support.apple.com/en-euro/guide/logicpro/lgcp39acefc9/mac), [FL Studio Channel Rack and Step Sequencer](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/channelrack.htm).
- **Drums favor fast step entry.** FL Studio presents one instrument per row and defaults each step to a sixteenth note. Logic gives each row a sound assignment and exposes per-step values such as velocity and gate time. Composer should start drums on a 1/16 grid, with named rows and direct on/off cells, while still storing ordinary MIDI notes. Sources: [FL Studio Channel Rack and Step Sequencer](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/channelrack.htm), [Logic Pro Step Sequencer overview](https://support.apple.com/en-euro/guide/logicpro/lgcp39acefc9/mac).
- **Expression lives below the note grid.** Ableton places velocity and chance lanes beneath its note editor. Composer should ship velocity first, because it affects playback and MIDI export directly; chance can remain a later expressive option. Source: [Ableton Live 12 MIDI editing](https://www.ableton.com/en/live-manual/12/editing-midi/).
- **Audition and focus reduce friction.** Ableton and Bitwig can audition a pitch or drum pad from the row header; Ableton can fold to used notes and highlight or fold to a scale. Composer should keep audition always available and offer beginner-friendly `In key` and `Used rows` filters. Sources: [Ableton Live 12 MIDI editing](https://www.ableton.com/en/live-manual/12/editing-midi/), [Bitwig note-event editor](https://www.bitwig.com/userguide/latest/working_with_note_events/).

## Adaptation to Composer

### Entry from Arrange

Each existing track row gains a compact pattern strip aligned to the song-section timeline and a labeled `Edit sequence` action. A cell communicates one of three states:

- empty: no notes for that track in the section;
- populated: miniature note or hit marks;
- linked: reuses the source section's sequence until the user chooses `Make variation`.

Selecting a section cell and choosing `Edit sequence` opens that track and section. Double-clicking a populated cell is the expert shortcut. Track mute, solo, instrument, and volume remain on the Arrange overview rather than being duplicated in the editor.

### Shared sequencer shell

Both editors keep the same stable anatomy:

1. Breadcrumb: `Arrange / Track / Section` and a clear `Back to arrangement` action.
2. Section strip: previous/next sections and the current section's bar count.
3. Editor toolbar: Select, Draw, Erase, grid resolution, audition, undo/redo, and an icon-only loop-section playback control labeled by tooltip and accessible name.
4. Time ruler: bars and beats horizontally, aligned to the selected section.
5. Musical rows: piano keys for pitched tracks; named kit pieces for drums.
6. Velocity lane: aligned vertically with selected notes or hits.
7. Context inspector: plain-language selection properties and one primary action.

The selected section loops during editing. Playback may continue into adjacent sections only when the user turns off `Loop section`.

### Piano sequencer

- Default visible range centers on existing notes, or on middle C when empty.
- Clicking a piano key auditions the instrument.
- Draw creates a note at the current grid length; drag changes duration; dragging a note moves pitch or time.
- `In key · D minor` highlights scale rows without preventing chromatic notes.
- `Used rows` hides unused pitches but always keeps the selected key's scale context recoverable.
- Notes use the track accent; scale and root information use restrained neutral highlights so emotion colors retain their semantic meaning.
- The inspector describes musical pitch first (`A3`) and MIDI number second, avoiding theory-heavy defaults.

### Drum sequencer

- Row headers show human names such as `Kick`, `Snare`, `Closed hat`, and `Open hat`; MIDI note numbers remain in the inspector and export layer.
- The first release uses one cell per sixteenth note. Clicking toggles a hit; dragging paints hits; secondary click or Erase removes them.
- Beat boundaries are stronger than sixteenth subdivisions, and alternate bars receive a subtle surface shift.
- Hit intensity reflects velocity using size/opacity, paired with the numeric velocity lane and inspector so color is never the sole cue.
- Clicking a row's play control auditions that drum part.
- `Used rows` reduces large kits to populated parts; `All kit pieces` restores the full mapped kit.
- Open/closed hats may later use choke-group behavior, but the MVP only needs deterministic note-on/note-off export.

## Key user flows

### Write a melody

1. In Arrange, select `Melody / Voice` and the `Verse 1` section cell.
2. Open the sequence; the editor inherits D minor, 92 BPM, 4/4, and eight bars.
3. Turn on Draw and add or record notes while the section loops.
4. Select notes to adjust length and velocity.
5. Move to the next section or return to Arrange; changes are already canonical and undoable.

### Dictate a drum rhythm

1. In Arrange, select `Rhythm / Brush kit` and the `Verse 1` section cell.
2. Open the drum grid; rows are labeled by kit piece and the grid defaults to 1/16.
3. Paint kick, snare, and hi-hat hits while the section loops.
4. Select accented hits and raise velocity in the lower lane.
5. Copy the pattern to `Verse 2`, or link it and choose `Make variation` only when it needs to diverge.

### Reuse a repeated section

1. A repeated section initially links to the source section's track sequence.
2. Editing a linked cell presents `Edit source` and `Make variation`.
3. `Make variation` clones the sequence into the repeated section, then opens it with an undoable operation.

## Canonical model

Use one event model for both editors so playback and MIDI export do not fork:

```ts
interface SequenceClip {
  id: string
  trackId: string
  sectionId: string
  sourceClipId: string | null
  notes: MidiNoteEvent[]
}

interface MidiNoteEvent {
  id: string
  pitch: number
  startBeat: number
  durationBeats: number
  velocity: number
}

interface DrumKitPiece {
  pitch: number
  name: string
  shortName: string
  order: number
  chokeGroup: string | null
}
```

- `pitch` remains the MIDI note number for every event; the drum editor resolves it through the selected kit map.
- `startBeat` and `durationBeats` are section-relative and may use fractional beats.
- Clip duration is derived from the section's bar count and meter, avoiding duplicate timeline truth.
- A linked clip has `sourceClipId` and no independent note mutations until it is made into a variation.
- Increment `schemaVersion` and migrate existing projects by adding an empty `sequenceClips` array.

## MVP scope

Ship first:

- section-scoped clips for every arrangement track;
- piano and named-drum row modes;
- Select, Draw, Erase, move, resize, copy/paste, and delete;
- 1/4, 1/8, and 1/16 grids;
- looped audition, row audition, velocity editing, scale highlighting, and used-row folding;
- linked repeated sections and `Make variation`;
- undoable project operations, local persistence, preview playback, and multitrack MIDI export.

Defer:

- probability/chance, ratchets, per-note automation, MPE, micro-pitch, groove templates, live MIDI recording, automation rows, and custom drum remapping;
- unconstrained cross-section notes. The first release clips notes to section bounds and can later add ties/pickups explicitly.

## Accessibility and input

- Every note/hit exposes track, pitch or drum name, bar, beat, duration, and velocity in its accessible name.
- The grid supports keyboard traversal by row and time cell; Space toggles a drum hit or previews a piano note, Enter creates/edits, Delete removes, and arrow keys move the selection.
- Selection is indicated by outline and handles, not color alone.
- Row audition controls and tool buttons have visible labels or persistent tooltips.
- Minimum pointer targets are 42px in toolbars; dense grid cells remain visually smaller but receive a larger hit target where rows allow it.
- Zoom and fold controls must not remove the keyboard path to hidden content.

## Implementation sequence

1. Add `SequenceClip`, `MidiNoteEvent`, drum-map types, schema migration, project operations, and fixtures.
2. Project sequence events into the existing preview engine and MIDI exporter; test section boundaries and track separation.
3. Add the Arrange pattern strip and linked/empty/populated states.
4. Build a shared `SequenceEditor` shell and time-grid math.
5. Add piano row headers, note blocks, scale highlighting, note resizing, and velocity.
6. Add drum row headers, step painting, kit mapping, used-row folding, and velocity.
7. Add repeated-section linking/variation flow, keyboard access, responsive behavior, and end-to-end coverage.

## Acceptance checks

- A user can create a melody and drum pattern without leaving Arrange.
- Each instrument retains its own independent MIDI sequence and exported track.
- Piano and drum editors align the same event to the same beat.
- Repeated sections remain linked until explicitly varied.
- Editing, variation creation, and deletion are undoable and survive save/reopen.
- Preview audio and exported MIDI agree on pitch, timing, duration, velocity, tempo, and meter.
- At 1280 × 800 the row labels, grid, inspector, and persistent transport remain usable without clipped controls.
