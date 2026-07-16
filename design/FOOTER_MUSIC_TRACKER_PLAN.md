# Footer music tracker implementation plan

## Approved direction

Add a compact, segmented song-position tracker immediately above the persistent transport bar. Each song section keeps its project-defined color and relative planned width, while a high-contrast playhead and elapsed time expose the current preview position.

Reference: [`screens/20-footer-music-tracker.svg`](./screens/20-footer-music-tracker.svg)

## Playback behavior

- Preserve the complete planned song timeline; unwritten bars play as silence so every visible tracker position has a stable beat and duration.
- Track elapsed and total preview seconds in the project store.
- Derive playable section beat ranges from the same ordered phrases used by the audio preview, preventing the UI and audio sequence from drifting apart.
- Map the live beat directly into the planned section bar widths, including silent unwritten portions.
- Reset position when playback is explicitly stopped or a different project is opened; retain the final position when a preview finishes naturally.

## UI structure

- Add a dedicated `SongPositionTracker` shell component.
- Render every project section as a proportional colored segment with its name.
- Show elapsed and total time, current section, and current bar.
- Mark uncomposed sections visually, keep them seekable, and expose section names and composition state to assistive technology.
- Keep a minimum segment width and horizontal overflow on narrow screens rather than hiding labels.
- Stack the tracker and existing controls inside one fixed footer shell.

## Layout integration

- Add tracker and combined footer-height tokens.
- Update workspace and library viewport calculations to subtract the complete footer stack.
- Update the application root bottom padding to use the same combined token.

## Verification

- Unit-test preview section ranges, including skipped empty sections.
- Unit-test time/position projection at section boundaries and incomplete sections.
- Run TypeScript/Vue type checks, lint, unit tests, architecture import-boundary tests, and the production build.
- Render or inspect the implemented footer at desktop and compact widths if browser tooling is available.

## Path audit

- Use existing aliases: `@domain/*` for playback projections and `@presentation/*` for shell components/store access.
- Avoid barrel files that do not exist for shell components; import component `.vue` files directly, matching the current shell pattern.
- Validate all new paths through `vue-tsc`, Vite build resolution, and the architecture boundary test.
