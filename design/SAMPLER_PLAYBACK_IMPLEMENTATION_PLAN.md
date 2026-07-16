# Sampled playback and instrument selection implementation plan

## Outcome

Replace the oscillator-only arrangement preview with sampled instruments powered by `smplr`, with particular attention to useful acoustic and electronic drum sounds. Let the user select a sound for every track in Arrange, persist that choice with the project, and hear it consistently in song playback, section loops, chord audition, and sequencer row audition.

MIDI notes remain the canonical musical data. This change improves local audio preview; it does not turn audio samples into project data or change note timing, velocity, track separation, or MIDI export semantics.

## Product decisions

- Use `smplr` as the browser sampler engine behind the existing `PlaybackEngine` port.
- Bundle a curated, license-compatible starter library with the application. Playback must work in the browser and packaged Tauri app without reaching a CDN.
- Offer only instruments whose assets are installed and verified. Do not expose the entire upstream catalog and download sounds after selection.
- Store a stable instrument ID on each arrangement track. Labels such as `Soft piano` are presentation text and may change without invalidating saved projects.
- Keep sequence notes as MIDI pitches. Drum kits translate General MIDI percussion pitches to their own sample keys at playback time; changing kits never rewrites a pattern.
- Load lazily per selected instrument, cache decoded samples, and prepare all sounds required by a transport pass before starting its clock.
- Retain a small synthesized fallback so one missing or undecodable asset does not make the whole arrangement silent.
- Preserve the replaceable adapter boundary described in `architecture.md`; Vue, the project domain, and MIDI export must not import `smplr`.

## Starter instrument catalog

The initial catalog should match the choices already shown in Arrange while using stable IDs:

| Role | Stable ID | Label | Playback source |
| --- | --- | --- | --- |
| Harmony | `keys.soft-piano` | Soft piano | Sampled piano preset |
| Harmony | `keys.electric-piano` | Electric piano | Sampled electric piano preset |
| Harmony | `guitar.nylon` | Nylon guitar | SoundFont/sample preset |
| Harmony | `strings.warm-ensemble` | Warm strings | SoundFont/sample preset |
| Bass | `bass.upright` | Upright bass | SoundFont/sample preset |
| Bass | `bass.electric` | Electric bass | SoundFont/sample preset |
| Bass | `bass.synth` | Synth bass | SoundFont/sample preset |
| Bass | `strings.cello` | Cello | SoundFont/sample preset |
| Rhythm | `kit.brush` | Brush kit | Local one-shot kit |
| Rhythm | `kit.acoustic` | Acoustic kit | Local one-shot kit |
| Rhythm | `kit.electronic` | Electronic kit | Local one-shot kit |
| Rhythm | `kit.hand-percussion` | Hand percussion | Local one-shot kit |
| Melody | `voice.guide` | Voice | Sampled voice/choir guide |
| Melody | `guitar.electric-clean` | Electric guitar | SoundFont/sample preset |
| Melody | `wind.flute` | Flute | SoundFont/sample preset |
| Melody | `synth.lead` | Synth lead | SoundFont/sample preset |

This is a product catalog, not a promise to ship every preset returned by `smplr`. During the asset audit, a preset may be replaced by a better-licensed or smaller source while its stable product ID remains unchanged.

Each catalog entry includes:

```ts
interface InstrumentDescriptor {
  id: string
  label: string
  role: TrackRole
  family: 'keys' | 'guitar' | 'strings' | 'bass' | 'wind' | 'voice' | 'synth' | 'drums'
  description: string
  defaultPreviewPitch: number
  drumMapId: string | null
}
```

Keep this descriptor catalog in a domain-level arrangement module because it expresses valid product choices. Keep sample URLs, `smplr` constructors, gain compensation, loop settings, and decode details in the infrastructure playback registry keyed by the same ID.

## Canonical project model and migration

Change the track model from a presentation label to a stable reference:

```ts
interface ArrangementTrack {
  id: string
  name: string
  role: TrackRole
  instrumentId: string
  volume: number
  muted: boolean
  solo: boolean
}
```

Increment `schemaVersion` from 2 to 3. Migration rules:

1. Map every known version-2 label and casing variant to the matching stable ID.
2. Map known fixture labels such as `Nylon guitar`, `Acoustic kit`, `Electric piano`, and `Voice` explicitly; do not infer them only from track role.
3. Preserve an unknown legacy label as `legacy:${encodeURIComponent(label)}` instead of silently replacing it. The catalog resolver displays the decoded old label as `Unavailable`, while playback uses the role's default fallback.
4. New projects receive role defaults: soft piano, upright bass, brush kit, and voice guide.
5. Parsing permits an unknown non-empty instrument ID so a project made by a newer Composer version can still open. Availability is a catalog concern, not a schema rejection.
6. Update original examples, fixtures, generated JSON assets, and tests to version 3 in the same change.

Changing an instrument is an ordinary undoable `updateTrack` mutation. It must not alter sequence clips, notes, velocities, mute/solo state, or track volume.

## Drum note contract

Define one shared General MIDI percussion map outside the Vue component. At minimum, every shipped kit must cover the eight currently exposed rows:

| MIDI | Product row |
| ---: | --- |
| 36 | Kick |
| 37 | Side stick |
| 38 | Snare |
| 42 | Closed hat |
| 45 | Low tom |
| 46 | Open hat |
| 49 | Crash |
| 51 | Ride bell |

Each kit registry maps these pitches to sample keys and may add more GM pieces later. If a selected kit lacks a pitch already present in a clip, show the row as unsupported and use the kit's documented nearest fallback for preview; retain and export the original pitch unchanged. Add choke groups only after deterministic kit switching and stop behavior work; they are not required for this change.

Move `drumRows` out of `SequenceEditor.vue`. The editor, playback adapter, accessibility labels, and tests must resolve names from the same map.

## MIDI import adaptation

When a MIDI file becomes a Composer arrangement, resolve its track program and percussion metadata through the same instrument catalog used by Arrange:

- channel-10/percussion tracks select `kit.acoustic` and retain their General MIDI drum pitches;
- piano and electric-piano programs select the closest keys preset;
- guitar, bass, strings, voice, wind, and synth program families select the closest role-compatible preset;
- a specific imported instrument name can refine an absent or inconsistent program number;
- unsupported programs fall back to the role default without dropping notes or changing their pitch, timing, duration, or velocity.

The imported arrangement stores Composer's stable `instrumentId`, not a raw MIDI.js display name. Tests must cover at least one pitched program and one percussion track.

## Audio asset strategy

`smplr` ships an engine and helpers, but its convenient presets normally reference separately hosted samples. Installing the package alone does not make Composer offline-capable. Before implementation, audit and select the assets for each starter preset.

For every asset or source pack, record in `src/main/infrastructure/playback/assets/LICENSES.md`:

- product instrument IDs using it;
- upstream project and direct source URL;
- author/performer when supplied;
- license and required attribution;
- whether modification and redistribution are allowed;
- original filename and a checksum;
- converted output filenames and conversion command, if any.

Asset acceptance gates:

- redistribution is explicitly permitted;
- all required attribution is included in the application/repository;
- formats decode in Chromium and the macOS Tauri WebView;
- production builds contain the assets at hashed, base-aware URLs;
- playback succeeds with network access disabled;
- the initial compressed asset budget is measured and approved before committing a large library;
- silence is trimmed and peaks are normalized without destroying velocity differences;
- drum samples contain no unintended loops or long tails that make `stop()` ineffective.

Prefer Vite-imported asset URLs from the playback infrastructure rather than root-relative `/audio/...` paths. Root-relative paths can work in Vite development and then fail under a packaged Tauri base URL.

## Playback architecture

### Event projection

Extend `SongPreviewEvent` with `instrumentId`. `buildSongPreview()` gets it from the owning track for both explicit sequence clips and generated phrase accompaniment. Mute/solo behavior stays where it is today.

Extend audition requests with instrument context:

```ts
interface PhrasePlaybackRequest {
  // existing phrase and frame fields
  instrumentId: string
}

interface PlaybackEngine {
  auditionNote(midiNote: number, role: TrackRole, instrumentId: string, volume?: number): Promise<void>
  auditionChord(symbol: string, instrumentId?: string): Promise<void>
}
```

Phrase playback uses the project's harmony-track selection, falling back to `keys.soft-piano`. Sequencer row audition passes the currently edited track's `instrumentId`, not just its role.

### Infrastructure components

Split the current concrete engine into focused pieces while retaining one application-facing adapter:

- `SampledPlaybackEngine`: implements `PlaybackEngine`, prepares a transport pass, schedules notes, and owns stop/disposal behavior.
- `InstrumentSamplerRegistry`: maps stable IDs to local `smplr` factories and playback metadata.
- `InstrumentCache`: holds one in-flight load promise and one ready instrument per audio context and instrument ID.
- `TrackOutput`: per-track gain node used for volume and future pan/effects; it prevents each sampler from bypassing track gain.
- `FallbackSynth`: the current oscillator behavior, reduced to a private failure path rather than normal playback.
- `gmDrumMap`: shared product pitch names plus per-kit sample-key mappings.

Do not feed the exported MIDI file back into a general MIDI player. The canonical project already produces accurately timed preview events and supplies mute, solo, section, and instrument context that would otherwise need to be reconstructed.

### Loading and scheduling

1. Resume or create the `AudioContext` from the user gesture.
2. Build the preview and collect unique selected instrument IDs for audible events.
3. Resolve unavailable IDs to role defaults and expose a non-fatal warning.
4. Await the cache's deduplicated loads before capturing the transport start time.
5. Create/reuse per-track output gains and schedule every note relative to one shared start time.
6. Apply velocity at the voice level and track volume at the output gain. Avoid multiplying both values twice inside preset-specific gain compensation.
7. For sustained instruments, schedule or retain a voice handle and stop it at note duration. For drum hits, allow the one-shot tail unless transport `stop()` is called.
8. `stop()` cancels all retained voice handles, invalidates the current scheduling generation, clears output nodes, and prevents a late load promise from starting an obsolete transport.
9. Changing a track instrument while playing first stops the current pass. The next play or audition loads the new selection; old decoded instruments may remain in the bounded cache.

Add a cache policy so repeated instrument browsing cannot grow memory without limit. The first implementation can cap inactive decoded instruments and evict least-recently-used entries, while never evicting an instrument used by the current transport.

### Failure behavior

- A failed preset load falls back only that instrument to `FallbackSynth`; other tracks continue with samples.
- The UI reports `Could not load Acoustic kit; using basic preview sound.` without turning the whole transport into an error.
- Retrying playback retries a failed load after a short cooldown; failed promises are not cached forever.
- No failure path silently fetches from an upstream CDN.
- Environments without `AudioContext` retain the existing unavailable-audio behavior.

## Arrange user experience

Replace the component-local `instruments` record in `ArrangeWorkspace.vue` with the shared descriptor catalog filtered by track role.

Each track row keeps its existing instrument selector and adds:

- grouped or clearly labeled catalog options for that track role;
- a compact loading state while the newly selected preset is decoded;
- an `Unavailable` option when opening a project with an unknown legacy ID;
- an accessible status message when fallback audio is being used;
- optional `Preview sound` action using the catalog's default preview pitch. Do not auto-play on every keyboard traversal of the select.

When the user changes a rhythm kit:

- existing hit positions and MIDI pitches stay intact;
- the pattern miniatures stay intact;
- sequencer row names come from the shared GM map;
- row audition immediately uses the new kit after it loads;
- the surface header displays the catalog label, never the stable ID.

The Sequence Editor can show the same selector in its header in a later refinement, but the first release needs one authoritative control on the Arrange overview. Avoid two controls with inconsistent loading states.

## MIDI export boundary

Keep note events unchanged. Resolve the stable instrument ID to its human label when writing the track-name meta event so exported tracks continue to read `Harmony · Soft piano`, not `Harmony · keys.soft-piano`.

Do not add MIDI Program Change messages in this change. A sampled product preset is not necessarily equivalent to a General MIDI program, and drum tracks currently do not reserve MIDI channel 10. Program/bank mapping and GM channel allocation require a separate export decision and tests.

## Implementation sequence

### 0. Compatibility and asset spike

1. Install `smplr` on an isolated branch/change and verify its current TypeScript API for scheduled start, duration/stop handles, destination routing, local `Sampler` buffers, and disposal.
2. Build a minimal acoustic-kit and pitched-instrument probe using local files.
3. Run it in Vite browser development and Tauri development/production packaging.
4. Measure first-load time, decoded memory, and bundle size.
5. Complete the redistribution/license ledger before committing the sample pack.

Exit criterion: one pitched preset and one eight-piece drum kit play offline, stop cleanly, and pass the asset/legal gates.

### 1. Catalog and schema

1. Add the product instrument catalog and shared GM drum map.
2. Add `instrumentId`, schema version 3, deterministic v2 migration, and unavailable legacy resolution.
3. Update factories, examples, fixtures, generated reference assets, and unit tests.
4. Make MIDI track labels resolve through the catalog.

Exit criterion: existing projects import without losing their selected instrument meaning, and save/reopen preserves stable IDs.

### 2. Sampled playback adapter

1. Add `smplr` as a runtime dependency.
2. Add verified local assets and the infrastructure sampler registry.
3. Implement cache, per-track outputs, scheduling, stop handles, cancellation generation, and oscillator fallback.
4. Add instrument IDs to preview and audition contracts.
5. Switch `application.ts` from `WebAudioPlaybackEngine` to `SampledPlaybackEngine` only after adapter tests pass.

Exit criterion: the same project events produce sampled pitched notes and distinct GM drum hits at the correct time, velocity, duration, and volume.

### 3. Instrument selection UI

1. Replace hard-coded component choices with the shared catalog.
2. Wire selection through the undoable project mutation and persistence path.
3. Pass selected instrument IDs into chord and row audition.
4. Add loading, unavailable, fallback, and retry status without blocking arrangement editing.
5. Verify keyboard and screen-reader behavior for the selector and status messages.

Exit criterion: every track can switch among its supported presets, the sound changes on the next audition/play, and the selection survives reload and undo/redo.

### 4. Verification and rollout

1. Run unit, integration, component, E2E, production build, and Tauri smoke checks.
2. Test with network disabled and a cleared browser cache.
3. Test rapid play/stop/play, rapid preset changes, seeking, looped sections, mute/solo, and project switching during a load.
4. Compare preview timing and exported MIDI events to ensure audio work did not change canonical event data.
5. Document bundled samples and attribution in the README or About surface required by their licenses.

Exit criterion: sampled playback is the default with no regressions to project persistence, sequencer editing, or MIDI export.

## Test plan

### Unit

- catalog IDs are unique and every role has a valid default;
- every available descriptor has exactly one infrastructure registry entry;
- every rhythm kit covers the required GM pitches;
- version-2 labels migrate deterministically; unknown labels remain recoverable;
- `buildSongPreview` attaches the owning track's instrument ID;
- selection changes never mutate notes or clips;
- MIDI export resolves labels while preserving all note bytes;
- cache deduplicates concurrent loads and permits retry after failure;
- stale load completions cannot start a stopped transport;
- gain and velocity values are bounded and applied at the intended stage.

### Integration/component

- Arrange lists only instruments valid for the track role;
- changing a preset is undoable, redoable, and autosaved;
- an unavailable legacy preset is visible and replaceable;
- row audition passes pitch, role, selected instrument, and volume;
- selecting another drum kit retains the existing clip and GM rows;
- loading and fallback statuses are announced accessibly;
- fake sampler voices receive the expected start times, stop times, and destinations.

Use injected fake sampler factories in tests. JSDOM does not provide a trustworthy decoder or audible Web Audio implementation, so tests should assert scheduling semantics rather than mock `smplr` globally in each component.

### E2E/manual audio

- choose two different kits and confirm kick, snare, hat, tom, crash, and ride are distinguishable;
- choose two pitched instruments on the same MIDI sequence and confirm only timbre changes;
- play a full arrangement, section loop, chord audition, and row audition;
- stop during a long note and during preset loading; no late or stuck sound may occur;
- reload the project and confirm all selections;
- run offline in browser and packaged Tauri;
- verify no requests target `smpldsnds`, GitHub Pages, unpkg, or other sample CDNs.

## Bad-path register

Keep this table current during implementation. When a path is encountered, add the concrete file/test reference and mark it fixed only when its prevention check passes.

| ID | Bad path / warning sign | Consequence | Required correction and prevention check | Status |
| --- | --- | --- | --- | --- |
| BP-01 | Install `smplr` and assume its preset audio is bundled | Preview fails offline or leaks runtime network dependencies | Vendor approved assets; E2E asserts zero sample-CDN requests with network disabled | Open — remote sources documented; local asset licensing still required |
| BP-02 | Persist labels such as `Soft piano` as sampler keys | Renames break saved projects and migrations | Persist stable IDs; migration and label-change tests | Fixed |
| BP-03 | Import `smplr` or asset URLs into domain/Vue modules | Playback implementation leaks across architecture boundaries | Use the `PlaybackEngine` port and infrastructure registry; import-boundary test | Fixed |
| BP-04 | Instantiate or load a sampler for every note | Missed notes, excess decoding, and memory growth | Cache one in-flight/ready instance per context and instrument; concurrent-load test | Fixed for duplicate loads; bounded eviction remains BP-16 |
| BP-05 | Capture transport start time before instruments finish loading | First notes are late or skipped | Prepare unique instruments first, then start one transport clock; delayed-load scheduling test | Fixed |
| BP-06 | Let a resolved load promise schedule after `stop()` or project switch | Ghost playback starts unexpectedly | Scheduling generation/cancellation token; stop-during-load test | Fixed in engine; dedicated test remains open |
| BP-07 | Send sampler output directly to `context.destination` | Track volume and future mixing are bypassed | Route through per-track gains; graph/destination test | Open |
| BP-08 | Apply volume and velocity in multiple gain stages without calibration | Quiet tracks disappear or loud presets clip | Separate voice velocity, track gain, and preset compensation; peak/manual comparison check | Open |
| BP-09 | Treat all note durations like drum one-shots | Sustained sounds cut off or ring forever | Retain voice handles and apply instrument-class stop policy; pitched/drum duration tests | Fixed in scheduling; browser audio smoke remains open |
| BP-10 | Use sampler-specific drum names as canonical note data | Kit changes corrupt patterns and exported MIDI | Keep GM pitches canonical and translate per kit; kit-switch invariance test | Fixed |
| BP-11 | Rewrite or delete unsupported drum pitches on kit change | User-authored hits are lost | Preserve notes and show/fallback unsupported rows; unsupported-pitch test | Open |
| BP-12 | Keep the drum map duplicated in `SequenceEditor.vue` | UI names and playback samples drift | Share the GM map; catalog/map coverage test | Fixed |
| BP-13 | Use root-relative asset URLs | Works in Vite but fails in packaged Tauri | Use Vite-resolved imported URLs; production-package smoke test | Open |
| BP-14 | Expose every upstream preset before auditing it | Broken options, huge downloads, or incompatible licenses | Curate only installed descriptors; registry/catalog/license coverage tests | Open |
| BP-15 | Cache rejected load promises permanently | A temporary decode failure makes a preset unusable for the session | Evict failure after cooldown and expose retry; retry test | Open |
| BP-16 | Allow unbounded decoded-instrument caching | Browsing presets steadily exhausts memory | Add bounded LRU/explicit disposal; cache-cap test and memory measurement | Open |
| BP-17 | Change a preset during active playback without defining behavior | Old and new timbres overlap unpredictably | Stop current pass, mutate, then prepare next sound; E2E rapid-change test | Open |
| BP-18 | Add MIDI Program Change based on sampler preset names | Exported MIDI suggests false GM equivalence | Keep export notes unchanged; byte-level regression test | Fixed |
| BP-19 | Put rhythm MIDI on an arbitrary melodic channel while claiming GM playback compatibility | External players may not render drums | Do not claim/change this in the sampler feature; open a separate channel-10 export decision | Open |
| BP-20 | Trust JSDOM or oscillator-only tests as proof of audible quality | Technically passing implementation can still sound poor | Add real-browser/Tauri offline smoke checklist and human kit comparison | Open |
| BP-21 | Silently replace an unknown imported instrument | User intent and diagnostic evidence are lost | Preserve a recoverable `legacy:` ID and show it as unavailable; migration test | Fixed for project import; MIDI program import uses documented closest-role fallback |
| BP-22 | Commit sample assets without a source/license/checksum ledger | Redistribution and future maintenance risk | Make the ledger an asset acceptance gate and CI coverage check | Open |
| BP-23 | Assume one browser audio codec works everywhere Composer ships | Selected presets fail only in one runtime | Probe Chromium and macOS WebView; provide approved alternate encoding if needed | Open |
| BP-24 | Leave old oscillator arrays as the only `stop()` mechanism | Sampled voices become stuck after stop/seek | Centralize voice handles and disposal in the new engine; stop/seek tests | Open |

## Acceptance checks

- Drums sound like distinct sampled kit pieces rather than two square-wave frequencies.
- Every Arrange track offers multiple role-compatible instruments and plays the selected one.
- Instrument choices survive autosave, export/import, reload, undo, and redo.
- Switching a drum kit never changes stored pitches, timing, velocity, or exported MIDI notes.
- Song playback, section loops, phrase/chord audition, and sequencer row audition use the expected instrument.
- The first note starts on time after preparation; rapid stop, seek, and project switching produce no ghost or stuck voices.
- Mute, solo, volume, velocity, and start-beat seeking keep their current semantics.
- A missing asset degrades only its track and produces a useful, accessible warning.
- Browser and Tauri playback work with network access disabled.
- All bundled audio has a complete redistribution and attribution record.
- The full unit/integration/E2E suite, production build, and Tauri smoke check pass.

## Deferred work

- user-imported SF2/SF3 files;
- downloading optional sound packs;
- arbitrary user sample import and custom drum mapping;
- effects, pan, sends, mixer buses, and audio rendering/export;
- velocity layers and round-robin expansion beyond what the selected starter assets provide;
- MIDI Program Change/bank selection and General MIDI channel-10 export;
- per-section instrument changes or automation;
- live MIDI input and recording.
