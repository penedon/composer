# Composer — Vue 3 + Vite Code Implementation Plan

## Objective

Build a local-first Vue 3 application that guides an amateur songwriter from story and emotional intent to a deterministic composition project and multitrack MIDI export.

This plan supersedes the implementation sequence in the original CLI/Renardo-centered plan. The original document remains useful historical context, but the web experience and Phrase Workspace now define the MVP.

## Implementation status — 2026-07-15

All implementation phases are represented in the codebase. The browser MVP and Tauri v2 desktop shell share the same domain/application core and platform ports.

Verified locally:

- strict production and test typechecking;
- ESLint, including generated-output exclusions;
- 33 Vitest unit/integration assertions across 14 suites;
- 10 Playwright journeys across Chromium and WebKit;
- 16 reviewed visual baselines across `1440 × 1024` and `1280 × 800`;
- automated accessibility audit with no violations in the export journey;
- production Vite build;
- Rust/Cargo checks and tests;
- debug macOS `Composer.app` bundle generation.

The Tauri configuration targets macOS and Windows. A packaged Windows smoke run must execute on a Windows CI runner because this workspace is macOS.

## Delivery principles

- Build vertical slices that produce usable product behavior.
- Keep domain and application logic independent from Vue and platform APIs.
- Use one canonical `CompositionProject` source of truth.
- Mutate projects through application commands, never arbitrary component writes.
- Make operations deterministic, undoable, testable, and serializable.
- Reuse components by enriching stable semantic contracts.
- Do not create copied components with one extra feature.
- Keep `src/main` and `src/tests` physically separate.
- Keep each component in its own folder with an explicit public API.
- Preserve browser/Tauri portability through infrastructure ports.

## Selected stack

### Runtime

- Vue 3
- Vite
- TypeScript with strict checking
- Vue Router
- Pinia for reactive presentation/session coordination
- SCSS

### Testing

- Vitest
- Vue Test Utils
- Playwright for critical user flows
- DOM accessibility assertions integrated into component/e2e tests

End-to-end tests are release-blocking product acceptance tests. They verify behavior, canonical project outcomes, downloaded artifacts, accessibility, and stable visual states.

### Deferred selections

Focused spikes will choose:

- runtime schema validation;
- browser persistence wrapper;
- audio scheduling implementation;
- MIDI serialization implementation;
- immutable operation/patch implementation.

These dependencies must remain behind internal interfaces so the choice does not leak through the application.

## Source layout

```text
index.html                         # loads /src/main/index.ts
src/
├── main/
│   ├── index.ts                  # Vue bootstrap/composition root
│   ├── App/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── presentation/
│   └── shared/
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    │   ├── journeys/
    │   ├── visual/
    │   ├── accessibility/
    │   ├── fixtures/
    │   └── drivers/
    ├── fixtures/
    ├── fakes/
    └── setup/
```

Tests mirror production paths. For example:

```text
src/main/presentation/components/composition/PhraseBlock/PhraseBlock.vue
src/tests/unit/presentation/components/composition/PhraseBlock/PhraseBlock.spec.ts
```

## Component design policy

### Folder contract

```text
ComponentName/
├── ComponentName.vue
├── ComponentName.types.ts        # public props/emits types when useful
├── ComponentName.scss            # non-trivial local styles
├── useComponentName.ts           # cohesive behavior extracted when needed
├── ComponentName.model.ts        # presentation model only when needed
└── index.ts                      # allowed public exports
```

The `.spec.ts` lives in the mirrored folder below `src/tests`.

### Reuse decision process

Before creating a component:

1. Search existing component public APIs.
2. If the new need has the same semantic responsibility, enrich the existing component.
3. Prefer a prop for controlled behavior, a slot for content/layout extension, a typed emit for user intent, or a composable for reusable behavior.
4. Add accessibility behavior to the same component contract.
5. Add regression tests for existing and new behavior.
6. Create a different component only when semantics, lifecycle, or ownership genuinely differ.

Forbidden naming patterns without an architectural justification:

- `AdvancedX`
- `XWithFeature`
- `EnhancedX`
- `NewX`
- copied feature components distinguished only by styling

### Initial shared component families

Base components:

- `AppButton`
- `AppField`
- `AppSelect`
- `AppSlider`
- `AppDialog`
- `AppPopover`
- `AppTabs`
- `AppMenu`
- `AppTooltip`
- `AppStatus`

Shell components:

- `ProjectBar`
- `PhaseRail`
- `WorkspaceLayout`
- `ContextPanel`
- `TransportBar`
- `SaveStatus`

Musical components:

- `SectionBlock`
- `SectionLane`
- `PhraseBlock`
- `ChordEvent`
- `ChordLane`
- `BeatRuler`
- `EmotionToken`
- `EmotionLegend`
- `EmotionCurve`
- `TrackHeader`
- `TrackLane`
- `PlaybackControls`
- `SuggestionList`
- `TheoryExplanation`

These names define intended responsibilities, not permission to build all components before a real screen needs them.

`AppButton` must support text, leading/trailing icon slots, and an accessible icon-only mode through one API. A separate icon-button copy must not be introduced.

## Domain model plan

### Project aggregate

```ts
interface CompositionProject {
  schemaVersion: number;
  id: ProjectId;
  metadata: ProjectMetadata;
  frame: MusicalFrame;
  story: StoryDocument;
  emotionPlan: EmotionPlan;
  structure: SongStructure;
  arrangement: Arrangement;
  alternatives: AlternativeSet[];
  history: OperationRecord[];
}
```

### Core domain modules

- `project`: aggregate construction, schema version, invariants.
- `story`: freeform blocks and optional narrative labels.
- `emotion`: families, specific emotions, weighted relations, intensity points.
- `structure`: section definitions, section instances, repetitions, variations.
- `phrase`: ordered phrases, lyric anchors, phrase timing, instrumental phrases.
- `harmony`: key context, chord symbols, chord events, harmonic function.
- `rhythm`: tempo, meter, groove reference, harmonic rhythm.
- `arrangement`: tracks, instruments, regions, section placement.
- `history`: operations, alternatives, undo/redo semantics.

### Required invariants

- Stable opaque IDs for all editable entities.
- Section instances reference definitions explicitly.
- Variations reference their source and store intentional overrides.
- Phrase order and timeline position cannot contradict each other.
- Chord events use musical time, not pixels or DOM positions.
- Lyric anchors use semantic offsets that can be projected into layout.
- Emotion intensity is bounded and section/time references are valid.
- Track roles and instrument assignments remain separate concepts.
- Export never mutates the project.

## Application layer plan

### Commands

Initial command families:

- project: create, rename, update metadata, import, migrate.
- story: update text, add/remove/reorder narrative labels.
- emotion: select family, select featured emotion, update intensity point.
- structure: apply template, add/move/resize/repeat/vary section.
- phrase: create, edit lyrics, reorder, split, merge, set duration.
- harmony: add/move/resize/replace chord event.
- rhythm: update tempo/meter/groove/harmonic rhythm.
- arrangement: create track, assign instrument, move region, mute/solo view state.
- alternatives: branch, name, compare, accept.
- history: undo, redo, create checkpoint.

### Queries/view models

- project library summaries.
- current phase completeness.
- emotional arc plot.
- section intent summary.
- phrase workspace projection.
- chord lane projection.
- contextual harmonic-function explanation.
- tension/release analysis.
- arrangement lanes.
- export track preview.

Queries return presentation-ready models without embedding Vue reactivity.

### Ports

- `ProjectRepository`
- `PortableProjectGateway`
- `PlaybackEngine`
- `MidiExporter`
- `ProjectMigrationRegistry`
- `IdGenerator`
- `Clock`

## Store plan

Pinia stores remain thin coordinators:

- `useProjectLibraryStore`: recent projects and library operations.
- `useActiveProjectStore`: active aggregate snapshot, command dispatch, save state.
- `useWorkspaceStore`: phase, selection, panels, zoom, non-domain workspace state.
- `usePlaybackStore`: current playback session, transport state, errors.
- `useHistoryStore`: undo/redo availability and named checkpoints.

Rules:

- Stores call the application facade.
- Stores do not contain music-theory calculations.
- Repositories and adapters are injected during bootstrap.
- Store state is declared completely and typed.
- Derived state uses getters/selectors rather than duplicated fields.

## Implementation phases

### Phase 0 — Scaffold and guardrails

Deliverables:

- Initialize Vue 3 + Vite + TypeScript project.
- Configure `index.html` to load `/src/main/index.ts`.
- Add Vue Router, Pinia, SCSS, Vitest, Vue Test Utils, and Playwright.
- Configure aliases for `@main`, `@domain`, `@application`, `@infrastructure`, `@presentation`, and `@tests`.
- Configure strict TypeScript, ESLint, formatting, and import boundaries.
- Configure separate test discovery under `src/tests`.
- Configure Playwright to use `src/tests/e2e` with deterministic application test adapters.
- Add visual-regression projects for `1440 x 1024` and `1280 x 800` desktop viewports.
- Add reusable E2E fixtures and workspace drivers; do not duplicate selectors or setup across journeys.
- Add CI scripts for typecheck, lint, unit, integration, e2e, and production build.
- Add an architecture-boundary test or lint rule preventing inward layers from importing outward layers.

Exit criteria:

- Development server starts.
- Production build succeeds.
- One production smoke component and its mirrored test pass.
- One Playwright smoke journey boots the real application and captures a stable visual baseline.
- A forbidden dependency import fails validation.

### Phase 1 — Canonical project and migrations

Deliverables:

- Implement IDs, result/error types, musical time primitives, and schema version.
- Implement the first `CompositionProject` aggregate.
- Implement runtime external-file validation and migration registry.
- Implement JSON serialization round-trip.
- Add representative fixture projects.

Tests:

- Entity invariants.
- Invalid external JSON rejection.
- Current-version round-trip equality.
- Migration from at least one previous fixture schema.
- Unknown fields handled according to documented policy.

Exit criteria:

- A complete empty song project can be created, serialized, loaded, and validated without Vue.

### Phase 2 — Application command pipeline, history, and ports

Deliverables:

- Application facade and dependency container.
- Command dispatch/result model.
- Operation records and undo/redo prototype.
- In-memory project repository.
- Fake playback, clock, ID, and export adapters.

Tests:

- Commands preserve invariants.
- Failed commands do not change project state.
- Undo/redo returns exact prior/next state.
- Operation records serialize.

Exit criteria:

- Domain behavior can be exercised through application commands with no browser or Vue runtime.

### Phase 3 — Application shell and design system

Deliverables:

- App bootstrap and router.
- Global Studio Notebook tokens and typography.
- Base components required by the first screens.
- `ProjectBar`, `PhaseRail`, `WorkspaceLayout`, `ContextPanel`, `TransportBar`.
- Keyboard/focus conventions and accessible status announcements.
- Lazy-loaded phase pages with placeholder content.

Tests:

- Route navigation.
- Keyboard navigation and focus behavior.
- Shared component variants through one component API.
- Shell responsive behavior at reference desktop sizes.

Exit criteria:

- All phases are reachable in the persistent application shell.

### Phase 4 — Local project lifecycle and Story Workspace

Deliverables:

- Project library and new-project flow.
- Browser autosave repository.
- Portable JSON import/download.
- Story Workspace with unrestricted text.
- Optional narrative labels and outline projection.
- Save-status feedback and recovery snapshot.

Tests:

- Create/save/reopen project.
- Story editing and label operations.
- Autosave debounce/flush behavior.
- Invalid import and recovery flow.

Exit criteria:

- A user can create a local project, write a story, organize it optionally, close, and reopen it.

### Phase 5 — Musical frame and emotion planning

Deliverables:

- Genre/reference text, tempo, meter, key, and rhythmic-identity controls.
- Emotion taxonomy seed data and custom emotion support.
- Major-family and three-featured-emotion selection.
- Emotional Arc Builder with accessible curve editing.
- Section intent summaries.

Tests:

- Selection limits and weighted multi-family relations.
- Curve bounds and section/time validity.
- Keyboard-accessible point editing.
- Color-independent labels and summaries.

Exit criteria:

- A user can define a musical frame, select emotions, and shape a readable emotional arc.

### Phase 6 — Song structure and section variations

Deliverables:

- Structure templates as versioned local data.
- Structure comparison and manual builder.
- Add, reorder, resize, duplicate, and remove sections.
- Repeated section definitions and explicit variations.
- Downstream-impact preview when structure changes.

Tests:

- Template application.
- Section move/resize invariants.
- Source/variation links.
- Undo/redo for structural operations.

Exit criteria:

- The user can create a complete song structure without losing emotional intent mappings.

### Phase 7 — Phrase Workspace vertical slice

Deliverables:

- `PhraseBlock`, `ChordLane`, `ChordEvent`, and `BeatRuler` components.
- Create, edit, reorder, split, merge, and remove phrases.
- Lyrics with semantic chord anchors.
- Instrumental phrase support.
- Visible key, tempo, meter, groove, and lead-in context.
- `Shift+Enter` play-and-advance behavior.
- Play phrase, lead-in, loop, and play section commands.
- Browser playback adapter sufficient for chord audition.

Tests:

- Phrase editing and timeline projection.
- Chord positioning independent from rendered pixel geometry.
- Keyboard interactions.
- Deterministic playback request construction.
- Cross-phrase chord sustain and lead-in behavior.
- Component accessibility.

Exit criteria:

- A user can write several lyric phrases, position chords, and audition each phrase deterministically.

### Phase 8 — Harmonic guidance and alternatives

Deliverables:

- Chord vocabulary for MVP tonal scope.
- Harmonic-function analysis in key context.
- Contextual tension/release explanation.
- Requested chord suggestions categorized by intent.
- Audition without committing.
- Named phrase and section alternatives.
- Compare and accept flows.

Tests:

- Theory rules as pure domain tests.
- Context changes alter analysis appropriately.
- Suggestion requests never mutate until accepted.
- Existing work survives rejection and comparison.

Exit criteria:

- The user can request, understand, audition, compare, and accept a harmonic alternative.

### Phase 9 — Rhythm, instruments, and arrangement

Deliverables:

- Rhythm laboratory for tempo, groove, accent, and harmonic rhythm.
- Instrument browser organized by role and family.
- Arrangement timeline with instrument tracks.
- Track mute/solo playback state.
- Section/phrase material projected into track regions.
- Repeated-section variation display.

Tests:

- Rhythm timing transformations.
- Track-role/instrument separation.
- Arrangement projection consistency.
- Playback request contains the correct active tracks.

Exit criteria:

- The user can hear and inspect a multi-instrument song skeleton arranged by section.

### Phase 10 — Multitrack MIDI export

Deliverables:

- MIDI exporter adapter.
- Export preview with instrument-to-track mapping.
- Tempo, meter, note timing, duration, velocity, and track-name events.
- Scope export for entire song or selected material where supported.
- Downloadable `.mid` file.

Tests:

- Golden semantic MIDI event fixtures.
- Separate instrument tracks.
- Tempo/meter correctness.
- No canonical project mutation during export.
- Exported output can be parsed by an independent test parser.

Exit criteria:

- A generated MIDI file imports into a DAW with separate expected tracks and correct timing.

### Phase 11 — Hardening and first web release

Deliverables:

- Complete undo/redo and checkpoint UI.
- Autosave recovery and project migration UX.
- Error and empty states.
- Keyboard shortcut reference.
- Performance profiling for large projects and arc/timeline rendering.
- Accessibility audit.
- Critical end-to-end flow coverage.

Required e2e flows:

1. Create project -> write story -> save -> reopen.
2. Select emotions -> draw arc -> build structure.
3. Write phrase -> place chords -> `Shift+Enter` audition.
4. Request suggestion -> audition -> reject without mutation.
5. Create section variation -> undo -> redo.
6. Arrange instruments -> export separate MIDI tracks.

Required vision-contract assertions:

- Story and lyrics remain artist-authored; optional templates can be ignored.
- The dominant family and three featured emotions remain visible and editable through the composition journey.
- Emotional-arc changes request downstream review without silently rewriting phrases or harmony.
- The phase rail remains free navigation rather than a locked wizard.
- `Shift+Enter` plays the current phrase request and advances focus exactly once.
- Phrase playback contains explicit key, tempo, meter, groove, and lead-in context.
- Playing phrases out of order produces no hidden execution state.
- Chord suggestions do not mutate the project before acceptance.
- Rejecting a suggestion leaves canonical project JSON byte-equivalent after normalization.
- Phrase Workspace and Arrangement show consistent section, phrase, chord, and timing data.
- Section variations retain their source relationship and only store intentional overrides.
- Undo/redo restores exact canonical states across structural and phrase edits.
- Save, close, reopen, and recovery work using local adapters without authentication.
- JSON export round-trips the complete creative project.
- MIDI export downloads separate instrument tracks with verified tempo and timing events.
- Keyboard-only completion is possible for the primary journey.
- Emotion and track meaning remain understandable without color.

Required visual-regression states:

- persistent application shell;
- Story Workspace with optional outline;
- emotion selection and Emotional Arc Builder;
- structure builder with a repeated variation;
- Phrase Workspace with empty, active, playing, and alternative states;
- requested chord-suggestion panel;
- Arrangement with separate instrument tracks;
- save/recovery and MIDI export dialogs;
- error and empty states.

Visual regression rules:

- Capture approved states at `1440 x 1024` and `1280 x 800`.
- Freeze IDs, timestamps, animation, and seeded content.
- Prefer stable region snapshots when unrelated dynamic content would make a full-page snapshot brittle.
- Require behavioral assertions beside every important snapshot.
- Baseline changes require deliberate review and must not be updated automatically in CI.

Browser execution:

- Chromium and WebKit are required on pull requests.
- Firefox runs in the scheduled compatibility suite and before tagged web releases.

Exit criteria:

- The complete MVP workflow succeeds offline in a supported desktop browser.
- All vision-contract journeys, accessibility checks, and approved visual baselines pass.

### Phase 12 — Tauri packaging

Deliverables:

- Tauri shell around the built Vue application.
- Native filesystem and dialog adapters.
- macOS and Windows packaging.
- Platform capability configuration with least privilege.
- Native open/save/recent-file behavior.

Tests:

- Shared web suites remain green.
- Adapter contract tests run against Tauri filesystem behavior.
- Packaged smoke tests on macOS and Windows.

Exit criteria:

- The same canonical project opens, saves, plays, and exports on both desktop platforms.

## Performance plan

- Keep canonical project objects normalized or indexed where repeated lookup becomes measurable.
- Derive view models with memoized queries rather than duplicating canonical state.
- Lazy load route-level workspaces.
- Virtualize long phrase/track collections only after profiling demonstrates the need.
- Schedule autosave outside rapid pointer/keyboard interaction and flush on lifecycle boundaries.
- Keep SVG/chart redraw scoped to the changed series or section.
- Avoid deep reactive wrapping of large immutable domain snapshots when shallow references suffice.
- Profile before adding workers; MIDI export and complex analysis are candidates for later worker isolation.

## Accessibility plan

- All editing operations must be reachable without pointer-only interaction.
- Emotion and track identity never depend on color alone.
- Charts include textual summaries and keyboard-adjustable values.
- Playback changes use live-region status without excessive announcements.
- Focus returns predictably after dialogs and suggestion acceptance.
- Reduced-motion preferences disable non-essential motion.
- Shortcut behavior is documented and avoids trapping standard browser/editor commands.

## Definition of done for every feature

- Domain/application behavior is tested outside Vue where applicable.
- Component API reuses or enriches existing components before adding a new one.
- Production and test files follow mirrored source-set paths.
- Keyboard and accessibility states are implemented.
- Empty, loading, failure, and success states are accounted for.
- Undo/redo implications are explicit.
- Persistence and schema implications are explicit.
- No outward-layer dependency enters domain/application code.
- Typecheck, lint, relevant tests, and production build pass.
- Relevant Playwright journey coverage is added or updated; visual changes include deliberately reviewed baselines.
- Architectural or product lessons discovered during implementation update `architecture.md` or `.llm/lessons.md` in the same change.
