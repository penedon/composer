# Composer

Composer is a local-first songwriting workspace that helps an amateur composer turn a story and emotional arc into a playable song sketch. It organizes artist-authored narrative, a musical frame, three featured emotions, song structure, phrase-level lyrics and chords, arrangement tracks, and MIDI export.

The starting page includes complete song examples. `The Long Road Within` explores knowing yourself after a long, lonely trip and can be opened to inspect every composition phase, audition the arrangement, or export its MIDI.

## Run the web application

```sh
npm install
npm run dev
```

Open `http://localhost:1420`. No account, backend, or cloud storage is required.

## Quality checks

```sh
npm run typecheck
npm run lint -- --quiet
npm test
npm run test:e2e
npm run build
```

Unit, integration, and E2E code lives under `src/tests`; production code lives under `src/main`.

## Complete-song test fixtures

`Paper Constellations` is an original, checked-in reference song with complete lyrics, versioned project JSON, and a five-track Type-1 MIDI file. Regenerate the JSON and MIDI after changing its fixture factory with:

```sh
npm run fixtures:generate
```

Coldplay's `Clocks`, Scorpions' `Wind of Change`, and Queen's `Don't Stop Me Now` are registered as licensed-reference cases. Their copyrighted lyrics and MIDI arrangements are not distributed in this repository. If you have copies you are authorized to use, place them at the paths in [test-assets/licensed-reference-songs/README.md](./test-assets/licensed-reference-songs/README.md), then run:

```sh
npm run test:licensed-references
```

## Run the desktop application

Install the Rust toolchain and platform prerequisites for Tauri, then run:

```sh
npm run tauri:dev
```

Build the native bundle with:

```sh
npm run tauri:build
```

The web build uses browser-local autosave and downloads. Tauri uses application-local filesystem persistence and native open/save dialogs. Both share the same versioned JSON project model and MIDI exporter.

Architecture decisions are recorded in [architecture.md](./architecture.md), implementation history in [.llm/lessons.md](./.llm/lessons.md), and the phased plan in [.llm/plans/vue3_vite_code_implementation_plan.md](./.llm/plans/vue3_vite_code_implementation_plan.md).
