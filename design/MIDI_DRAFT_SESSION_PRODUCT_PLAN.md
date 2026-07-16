# MIDI performance and Draft Session product plan

## Recommendation

Add a **Draft Session** inside Arrange: a non-linear scratchpad where a musician can monitor a MIDI keyboard or controller, record takes against the project tempo, trim a useful range, and deliberately place that range into a song section.

Do not turn Arrange into two competing sequencers. Drafts are source material; section clips remain the only material that drives the canonical song timeline.

Visual drafts:

- [`flows/04-midi-draft-session-flow.svg`](./flows/04-midi-draft-session-flow.svg)
- [`screens/27-midi-draft-session.svg`](./screens/27-midi-draft-session.svg)

## What the user is actually plugging in

Composer can support a MIDI controller, a USB-MIDI keyboard, or a digital piano that exposes a MIDI port. MIDI carries note and controller events, not recorded sound. An acoustic piano—or a digital piano connected only through its headphone/audio output—requires audio recording, an audio interface, latency monitoring, and waveform storage. That is a separate product track and should not be implied by the MIDI UI.

Use the label **MIDI keyboard or controller** in onboarding, with a short diagnostic: “If the device appears as an audio input but not a MIDI input, Composer cannot record its keys yet.”

## Research distilled

- The Web MIDI API can enumerate inputs and receive timestamped MIDI messages, but it is not Baseline, requires a secure context, and requires explicit permission. Browser support must therefore be detected rather than assumed. Sources: [MDN Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API), [MDN `requestMIDIAccess()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess), [W3C Web MIDI specification](https://www.w3.org/TR/webmidi/).
- Chrome added an explicit permission prompt for all Web MIDI access. Composer should ask only after a user clicks `Connect MIDI`, explain why, and never request SysEx for note recording. Source: [Chrome Web MIDI permission update](https://developer.chrome.com/blog/web-midi-permission-prompt).
- A native desktop bridge is the reliable Tauri path. The Rust `midir` library currently supports CoreMIDI on macOS/iOS, WinMM or WinRT on Windows, and ALSA on Linux. Source: [`midir` platform documentation](https://docs.rs/crate/midir/latest).
- Successful non-linear music tools separate exploratory clips from the fixed arrangement. Ableton's Session View exists for improvisation that is later refined into the Arrangement; Logic Live Loops lets users experiment with cells/scenes and then capture an arrangement; Bitwig explicitly switches track playback ownership between Launcher and Arranger. Sources: [Ableton Session View](https://www.ableton.com/en/live-manual/12/session-view/), [Logic Live Loops](https://support.apple.com/en-mide/102113), [Bitwig Launcher and Arranger](https://www.bitwig.com/userguide/latest/triggering_launcher_clips_0/).
- Recording workflows benefit from count-in, overdub, reversible quantization, and fixed-length loop recording. Ableton treats record quantization as separately undoable and uses looping overdub for pattern building. Composer should adopt the safety principles without adopting the full DAW surface. Source: [Ableton recording new clips](https://www.ableton.com/en/live-manual/12/recording-new-clips/).

## Product vocabulary

Use four terms consistently:

- **Input** — the connected hardware port.
- **Draft take** — one recorded performance in the scratchpad.
- **Range** — the selected portion of a take, expressed in beats.
- **Section clip** — the existing canonical track/section sequence used by playback and MIDI export.

Avoid mixing “clip,” “pattern,” “take,” and “piece” for the same object. In the UI, `Draft take` can shorten to `Take 03`; the existing Arrange cells can remain `sequence` or `section clip`.

## Primary flow

1. Open `Arrange` and switch from `Song` to `Drafts`.
2. Click `Connect MIDI`; grant permission if the current platform needs it.
3. Select an input and a destination instrument track. Only one track is armed in the MVP.
4. Play without recording. Composer monitors the chosen instrument and shows incoming note/velocity activity.
5. Choose count-in, loop length, metronome, and quantization preview; then record.
6. Stopping creates one immutable-source draft take. A loop recording may contain several passes, but MVP displays one flattened take and supports undo of the entire recording.
7. Open the take, select all or a beat range, and click `Place in song`.
8. Choose destination track, section, and start beat. Choose `Add`, `Replace range`, or `Create variation` if content already exists.
9. Preview the result in section context. Confirming copies normalized note events into the existing `SequenceClip`; the draft remains unchanged.

## Draft Session UI

### Arrange-level navigation

Add a small segmented control below the Arrange heading:

- `Song` — the current section timeline and track pattern cells.
- `Drafts` — the scratchpad, MIDI connection, recording, and take library.

This is preferable to placing a live clip launcher beside the arrangement. Two simultaneously active timelines create unclear playback ownership, especially for a beginner-focused product.

### Drafts layout

The desktop screen has three zones:

1. **Connection and record strip** — device state, input selector, channel filter, monitor, metronome, count-in, fixed length, quantization preview, and one prominent record control.
2. **Take library** — rows grouped by Composer instrument track; cards show take number/name, length, note count, date, and a miniature note preview. Empty space invites `Record a take` rather than looking like an infinite DAW matrix.
3. **Take editor and placement inspector** — reuse the current piano/drum editor grammar. The inspector shows the selected range and a single primary action, `Place in song`.

### Record states

The status line must always distinguish:

- `MIDI unavailable`;
- `Permission needed`;
- `No device found`;
- `Connected · no input yet`;
- `Receiving · C4 · velocity 91`;
- `Count-in · 2 bars`;
- `Recording · bar 2 of 4`;
- `Device disconnected · recording stopped safely`.

Use a visible input meter or key pulse in addition to text. Do not show a green “connected” state before at least one port is open.

### Placement sheet

The placement sheet should answer five questions without requiring drag precision:

- What source range? `Bars 1–2` or a custom beat selection.
- Which destination track?
- Which song section?
- Where within the section?
- What happens to existing notes? `Add`, `Replace range`, or `Create variation`.

Default to the armed track, current song section, start of section, and `Add` only when the target range is empty. Otherwise default to `Create variation`. Preview boundary clipping before confirmation. Do not silently time-stretch a draft to fit a section.

Drag-and-drop from a take onto a section cell can be a later expert shortcut; the explicit sheet should be the MVP because it handles range, conflicts, and repeated-section links visibly.

## Suggested model

Keep hardware and live recording state out of the persisted project. Persist completed takes only.

```ts
interface DraftTake {
  id: string
  name: string
  trackId: string
  notes: MidiNoteEvent[]
  lengthBeats: number
  createdAt: string
  inputLabel: string | null
  quantizeSuggestion: QuantizeSettings | null
}

interface SequenceClip {
  id: string
  trackId: string
  sectionId: string
  sourceClipId: string | null
  sourceDraft: {
    draftTakeId: string
    fromBeat: number
    toBeat: number
  } | null
  notes: MidiNoteEvent[]
}
```

`sourceDraft` is provenance, not a live link. Editing or deleting a draft must never alter the arranged song. Placing the same range twice creates two independent section clips. This matches Composer's existing deterministic playback/export model.

Add `draftTakes` in the next schema migration. Device IDs are often platform- or session-specific, so store the last selected input in application preferences, not inside `CompositionProject`. A human-readable `inputLabel` on a take is useful diagnostic history but must not be used to reconnect.

## Input and recording architecture

Introduce ports around normalized events rather than importing a MIDI library into Vue components:

```ts
interface MidiInputGateway {
  availability(): 'native' | 'web' | 'unsupported'
  requestAccess(): Promise<void>
  listInputs(): Promise<MidiInputDescriptor[]>
  connect(inputId: string, onEvent: (event: NormalizedMidiEvent) => void): Promise<MidiConnection>
}

type NormalizedMidiEvent =
  | { type: 'note-on'; pitch: number; velocity: number; channel: number; timeMs: number }
  | { type: 'note-off'; pitch: number; velocity: number; channel: number; timeMs: number }
  | { type: 'sustain'; down: boolean; channel: number; timeMs: number }
```

Implementations:

- `TauriMidiInputGateway` — Rust `midir` callback, normalized in the backend, emitted through a narrowly scoped Tauri command/event bridge.
- `BrowserMidiInputGateway` — `navigator.requestMIDIAccess({ sysex: false })`, created only after an explicit click and guarded by feature detection.
- `UnsupportedMidiInputGateway` — returns a useful capability explanation without breaking Arrange.

Do not make Web MIDI the desktop abstraction merely because the UI is web-based. Tauri uses the operating system webview, and Web MIDI availability is not consistent enough to be the product's desktop hardware layer.

Live monitoring needs note gates, not the existing fixed-duration `auditionNote()` call:

```ts
interface LiveInstrumentGateway {
  noteOn(target: TrackSoundTarget, pitch: number, velocity: number): Promise<void>
  noteOff(target: TrackSoundTarget, pitch: number): void
  panic(): void
}
```

The sampler implementation should keep active voices keyed by input, channel, pitch, and an incrementing press ID. This prevents overlapping presses of the same pitch from terminating each other.

## Timing and normalization

- Use the high-resolution input timestamp and the same monotonic clock origin as the transport. Do not use `Date.now()`.
- Convert once: `beat = recordingStartBeat + (eventTimeMs - recordingStartMs - inputLatencyMs) * tempo / 60000`.
- Freeze tempo and meter for a take in the MVP. If project tempo changes mid-record, stop safely and explain why; tempo-map recording can come later.
- Treat Note On with velocity zero as Note Off.
- Track key-down and sounding states separately so sustain pedal (CC 64) can extend note durations until release.
- On stop, disconnect, or window blur, close open notes at the stop timestamp and send `panic()` so no voice hangs.
- Preserve raw timing in the stored take. Quantization should be a previewable transform applied during placement or as a separately undoable edit. Never quantize incoming timestamps destructively.
- A note that crosses the chosen destination boundary should be clipped with a visible warning. Do not create implicit cross-section notes in the first release.

## Bad paths to prevent

### 1. Recording directly into the selected section by default

This makes an exploratory performance destructive and creates ambiguity when the selected section is linked to another section. Record into a draft first; offer an explicit `Record directly to section` expert mode only after the basic workflow is proven.

### 2. Building an Ableton-style launcher before placement is validated

Scene launching, per-track playback takeover, quantized launches, stop buttons, and capture-to-arrangement create a second transport system. Composer needs a scratchpad and a promotion action, not another performance environment.

### 3. Treating MIDI input as audio recording

Do not promise the piano's original tone or support for microphones. Composer monitors its own selected sampler. Audio recording needs a separate file, waveform, device, latency, and storage design.

### 4. Persisting every incoming event immediately

The existing store saves after each mutation. Calling it for every MIDI message would flood undo history and storage. Buffer a recording in memory; stopping creates one validated `DraftTake` and one undoable project operation.

### 5. Reusing `auditionNote()` for monitoring

Its fixed duration loses the performer's actual note length and can leave perceptual overlap. Add explicit note-on/note-off gates and a panic path.

### 6. Requesting SysEx “for future compatibility”

SysEx expands the permission and security surface and is unnecessary for note, velocity, channel, or sustain recording. Keep it off until a concrete device-management feature requires it.

### 7. Destructive auto-quantization

Beginner-friendly does not mean erasing performance nuance. Keep raw timing, show `Original` versus `Quantized`, and allow partial-strength quantization later.

### 8. Using hardware port IDs as durable identity

Ports can be renamed, re-enumerated, or absent. Reconnect by an application preference plus user confirmation; always provide a device selector and hot-plug state.

### 9. Supporting every MIDI message in the first release

Ship note-on, note-off, velocity, channel filter, and sustain. Defer pitch bend, aftertouch, arbitrary CC automation, MIDI clock, program changes, MPE, MIDI 2.0 UMP, and controller mappings.

## MVP scope

Ship first:

- native desktop MIDI input on macOS, Windows, and Linux through one gateway;
- browser Web MIDI when feature detection succeeds;
- explicit connection and permission flow;
- hot-plug/disconnect handling and a visible input monitor;
- one armed track, channel `All` or 1–16, live note monitoring, sustain, and panic;
- 1- or 2-bar count-in, metronome, 1–16 bar fixed-length recording, and manual stop;
- draft take library grouped by track;
- piano/drum take editing using the existing editor grammar;
- non-destructive quantization preview;
- range selection and explicit placement into a section clip;
- add, replace-range, and make-variation conflict behavior;
- persistence, undo, preview playback, and MIDI export using the existing note model.

Defer:

- audio recording;
- multiple armed tracks and input routing matrices;
- clip/scene launching and capture-to-arrangement;
- comping several loop passes;
- Capture MIDI before record was pressed;
- controller mapping, MIDI output, clock sync, SysEx, program changes, MPE, and MIDI 2.0;
- tempo maps, punch-in/out, and cross-section notes.

## Implementation sequence

1. Add normalized MIDI event types, `MidiInputGateway`, fakes, capability detection, and state-machine tests.
2. Add native `midir` input behind Tauri and a browser Web MIDI adapter; verify permission, hot-plug, and disconnect states on real hardware.
3. Add gated live sampler playback and panic; test repeated pitch, velocity zero, sustain, disconnect, and held notes at stop.
4. Add an in-memory `DraftRecorder` that maps timestamps to beats and commits one take on stop.
5. Migrate the project schema with `draftTakes`; add take operations and repository round-trip tests.
6. Build the Arrange `Song / Drafts` navigation, connection strip, record states, and take library.
7. Reuse/extract the sequence grid for take editing and range selection.
8. Add the placement sheet and one operation that copies a bounded range into `SequenceClip` with provenance.
9. Verify playback/export agreement and run latency/manual hardware checks on all desktop platforms.

## Acceptance checks

- A user can connect a supported MIDI keyboard, hear the selected Composer instrument, and see note/velocity input.
- Note lengths match key release; sustain pedal extends them; stopping or unplugging never leaves a hanging voice.
- A four-bar take records against the project tempo and survives save/reopen.
- Recording produces one undo step, not one step per MIDI message.
- The raw take remains unchanged when quantizing or placing a selection.
- A selected subrange can be previewed and placed into a chosen track/section/start beat.
- Existing target notes require an explicit conflict choice.
- Repeated linked sections offer `Edit source` or `Create variation`; they are never silently unlinked.
- Browser builds explain unsupported or denied MIDI access without disabling manual sequence editing.
- Preview audio and exported MIDI agree on placed pitch, start, duration, and velocity.

## Validation questions before implementation

Test these with five to eight musicians before expanding scope:

1. Do users understand that Drafts are safe source material and Song is the committed arrangement?
2. Do they prefer fixed-length recording or manual stop for their first take?
3. Is selecting a range then choosing `Place in song` clearer than dragging a card onto a section?
4. When a target already has notes, do `Add`, `Replace range`, and `Create variation` match user expectations?
5. Do users expect the original hardware piano sound? If yes, the UI must state monitoring behavior more prominently and audio recording needs a separate roadmap.
