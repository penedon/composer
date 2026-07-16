# Composer Architecture

## Status

This document describes accepted architectural decisions for the Vue 3 web MVP and the intended Tauri evolution. Items that have not been decided are listed explicitly as open decisions rather than silently assumed.

## Architectural goals

- Keep narrative, emotional, and musical concepts independent from UI and export technologies.
- Allow browser and Tauri delivery without rewriting business logic.
- Make every user-visible transformation deterministic, testable, undoable, and serializable.
- Support fast phrase audition without coupling the domain to a specific audio engine.
- Maintain one canonical project model across Story, Arc, Phrase, and Arrangement views.
- Optimize for an amateur composer through plain-language guidance and progressive disclosure.

## Decision 001 — Vue 3, Vite, and TypeScript

**Status:** Accepted

The web MVP uses Vue 3, Vite, and strict TypeScript.

- Vue Single-File Components use `<script setup lang="ts">`.
- Vite's root `index.html` loads `/src/main/index.ts`.
- `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` are enabled where ecosystem compatibility permits.
- Production package versions are pinned by the lockfile rather than recorded in architecture documents.

**Reason:** The product is highly interactive, component-oriented, and suitable for a client-side application. TypeScript supports a canonical model shared by UI, persistence, playback, and export.

## Decision 002 — Separate production and test source sets

**Status:** Accepted

```text
src/
├── main/
│   └── ...production code
└── tests/
    └── ...test code
```

- No `*.spec.ts` or test fixtures are stored under `src/main`.
- Tests mirror the relevant production path under `src/tests`.
- Example:

  ```text
  src/main/presentation/components/composition/PhraseBlock/PhraseBlock.vue
  src/tests/unit/presentation/components/composition/PhraseBlock/PhraseBlock.spec.ts
  ```

**Reason:** Production and test code remain physically separated while component-level ownership remains easy to navigate.

## Decision 003 — Directed dependency layers

**Status:** Accepted

Dependencies point inward:

```text
Presentation (Vue, Router, Pinia)
             |
             v
Application (commands, queries, use cases, ports)
             |
             v
Domain (canonical project, rules, transformations)

Infrastructure (browser, audio, MIDI, Tauri)
             |
             +---- implements Application ports
```

Rules:

- Domain imports no Vue, Pinia, Router, DOM, browser storage, Web Audio, MIDI library, or Tauri API.
- Application imports domain types and declares ports needed from external systems.
- Infrastructure implements application ports.
- Presentation invokes application commands and queries through an injected application facade.
- Infrastructure never calls presentation code.

## Decision 004 — Canonical project aggregate

**Status:** Accepted

One versioned `CompositionProject` aggregate is the source of truth for:

- metadata and musical frame;
- story and optional narrative labels;
- emotion taxonomy references and selected emotions;
- emotional arc;
- section definitions, instances, repetitions, and variations;
- phrases and lyric placement;
- harmony, rhythm, tempo, meter, tracks, and instruments;
- alternatives and operation history.

UI-only state such as an open panel, selected tab, or zoom level is not part of the musical aggregate unless it is intentionally persisted as workspace preference.

## Decision 005 — JSON source of truth, MIDI as projection

**Status:** Accepted

- A schema-versioned JSON document is the portable project format.
- Runtime validation occurs at every external project boundary.
- Migrations upgrade older schema versions before domain construction.
- MIDI is generated from the canonical aggregate through an export port.
- MIDI export creates separate tracks by instrument/role.
- Importing MIDI into the full creative model is not part of the MVP.

## Decision 006 — Local-first persistence ports

**Status:** Accepted

Application ports:

```ts
interface ProjectRepository {
  list(): Promise<ProjectSummary[]>;
  load(id: ProjectId): Promise<CompositionProject>;
  save(project: CompositionProject): Promise<void>;
  remove(id: ProjectId): Promise<void>;
}

interface PortableProjectGateway {
  importProject(file: FileLike): Promise<CompositionProject>;
  exportProject(project: CompositionProject): Promise<BinaryFile>;
}
```

Initial adapters:

- Browser repository for autosave.
- Browser import/download gateway for portable JSON.

Later adapters:

- Tauri filesystem repository and native dialogs.

No cloud repository is required for the MVP.

## Decision 007 — Playback and export behind ports

**Status:** Accepted

The domain describes musical events semantically. Application ports perform technology-specific work:

```ts
interface PlaybackEngine {
  playPhrase(request: PhrasePlaybackRequest): Promise<PlaybackSession>;
  playSection(request: SectionPlaybackRequest): Promise<PlaybackSession>;
  stop(): Promise<void>;
}

interface MidiExporter {
  export(project: CompositionProject, options: MidiExportOptions): Promise<BinaryFile>;
}
```

- Phrase playback requests include explicit lead-in and context.
- Playback results do not mutate the canonical project.
- The concrete browser audio engine and MIDI serialization library remain replaceable.

## Decision 008 — Command-based mutations and undo

**Status:** Accepted

- Components emit user intent.
- Application commands validate and transform the project.
- A successful mutation produces an operation record sufficient for undo/redo and audit display.
- Domain transformations prefer immutable input/output semantics.
- Direct arbitrary mutation of nested canonical project state from components is prohibited.
- Named alternatives reference or branch canonical material without losing the source version.

The exact internal patch representation will be selected during the domain spike, but it must remain serializable and library-independent at the architectural boundary.

## Decision 009 — Pinia is presentation/session state

**Status:** Accepted

Pinia coordinates reactive presentation state, including:

- active project identity;
- current selection and workspace;
- command progress and errors;
- playback session state;
- derived view models cached for the UI.

Pinia is not the owner of music theory rules or persistence implementation.

- Store actions delegate to the application facade.
- Canonical project changes enter the store as application results.
- Components do not reach into repositories or audio adapters directly.
- Stores are divided by cohesive responsibility rather than one global store.

## Decision 010 — Router-level workspaces

**Status:** Accepted

Primary phases are route-level pages:

```text
/projects
/projects/:projectId/story
/projects/:projectId/frame
/projects/:projectId/emotions
/projects/:projectId/structure
/projects/:projectId/compose/:sectionId?
/projects/:projectId/arrange
/projects/:projectId/export
```

- The phase rail uses these routes.
- Route navigation is not a locked wizard.
- Route state identifies durable navigation context; transient editor state stays in stores/components.
- Pages are lazy loaded by phase.

## Decision 011 — Component ownership and reuse

**Status:** Accepted

Every component owns a folder:

```text
PhraseBlock/
├── PhraseBlock.vue
├── PhraseBlock.types.ts
├── PhraseBlock.scss
├── usePhraseBlock.ts        # only when component behavior warrants it
└── index.ts                 # public component API
```

The mirrored test folder is:

```text
src/tests/unit/presentation/components/composition/PhraseBlock/
└── PhraseBlock.spec.ts
```

Reuse rules:

- Extend an existing component when a new requirement preserves its semantic responsibility.
- Do not create `ComponentWithFeature`, `AdvancedComponent`, or visually copied variants.
- Prefer typed props, slots, emits, and composition.
- Shared primitive components own visual and accessibility contracts.
- Feature components own domain-oriented interaction, not generic styling.
- A component may use small private subcomponents within its folder when they are not reusable elsewhere.
- Promote a private subcomponent to shared scope only after a real second use.
- Public imports go through the component folder's `index.ts`; cross-feature deep imports are prohibited.
- A component should not become universal merely to satisfy reuse. Split it when semantics or lifecycle genuinely differ.

## Decision 012 — Styling architecture

**Status:** Accepted

- SCSS design tokens and reset styles live under `presentation/styles`.
- Components use a neighboring `.scss` file through scoped SFC styles when component styling is non-trivial.
- Global styles contain tokens, typography, focus behavior, and application-level layout only.
- Feature-specific selectors do not enter global styles.
- Emotion color tokens are semantic and paired with non-color indicators.
- Component states use data/ARIA attributes rather than duplicated modifier components.

## Decision 013 — Testing architecture

**Status:** Accepted

- Vitest is the unit and integration test runner.
- Vue Test Utils is used for Vue component tests.
- Browser-level critical-flow tests use Playwright.
- Tests are organized under `src/tests` as unit, integration, and e2e suites.
- Domain tests use no Vue runtime.
- Application tests use in-memory or fake port implementations.
- Component tests mock the application facade at the boundary rather than mocking internal component details.
- Playback tests use a deterministic fake clock/audio engine.
- MIDI tests assert semantic event output and track separation.
- Persistence tests cover validation, migration, save/reopen, and recovery.
- Accessibility checks are included in component and end-to-end coverage.

## Decision 014 — Web first, Tauri-compatible

**Status:** Accepted

- The first executable product is a client-side Vue/Vite web application.
- Browser-only APIs remain inside infrastructure adapters.
- Tauri was introduced after the web vertical slice validated the workflow and uses the same application ports.
- No Electron target is planned.
- Shared domain, application, presentation, and most browser-compatible infrastructure remain reusable inside Tauri.

## Decision 015 — End-to-end tests are a vision contract

**Status:** Accepted

Playwright end-to-end tests validate complete artist journeys and the approved product design, not only route availability.

Coverage rules:

- Tests use the real Vue application and application layer.
- External boundaries such as audio output, clocks, filesystem prompts, and ID generation may use deterministic test adapters.
- Tests assert canonical project outcomes in addition to visible UI results.
- Stable accessible roles, names, and labels are preferred as selectors.
- `data-testid` is allowed only when no stable semantic selector exists.
- Shared fixtures and page/workspace drivers prevent duplicated setup and selector logic.
- Visual regression baselines cover the approved `1440 x 1024` reference frame and `1280 x 800` minimum working frame.
- Visual snapshots focus on stable workspace regions and critical full-page states; transient animation and timestamps are disabled through test adapters.
- Behavioral assertions remain mandatory even when a visual snapshot exists.
- Downloaded JSON and MIDI files are parsed and semantically asserted rather than checked only for filename or existence.
- Keyboard-only flows and automated accessibility checks are part of the same release gate.

Required browser strategy:

- Chromium runs on every pull request.
- WebKit runs on every pull request for the macOS-oriented browser/Tauri path.
- Firefox runs in the scheduled/full compatibility suite and before a tagged web release.
- The macOS Tauri bundle has a local build smoke check; Windows packaged smoke belongs in Windows CI in addition to the shared web journeys.

The E2E suite must remain deterministic. Seeded projects, a controlled clock, stable ID generation, and a fake observable playback engine are injected through the normal application ports.

## Source-tree convention

```text
src/
├── main/
│   ├── index.ts
│   ├── App/
│   │   ├── App.vue
│   │   ├── App.scss
│   │   └── index.ts
│   ├── domain/
│   │   ├── project/
│   │   ├── story/
│   │   ├── emotion/
│   │   ├── structure/
│   │   ├── phrase/
│   │   ├── harmony/
│   │   ├── rhythm/
│   │   ├── arrangement/
│   │   └── shared/
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   ├── ports/
│   │   ├── services/
│   │   └── facade/
│   ├── infrastructure/
│   │   ├── persistence/browser/
│   │   ├── portability/json/
│   │   ├── playback/web-audio/
│   │   ├── export/midi/
│   │   └── platform/
│   ├── presentation/
│   │   ├── router/
│   │   ├── pages/
│   │   ├── components/
│   │   │   ├── base/
│   │   │   ├── shell/
│   │   │   ├── story/
│   │   │   ├── emotion/
│   │   │   ├── structure/
│   │   │   ├── composition/
│   │   │   ├── harmony/
│   │   │   ├── rhythm/
│   │   │   └── arrangement/
│   │   ├── composables/
│   │   ├── stores/
│   │   └── styles/
│   └── shared/
│       ├── errors/
│       ├── ids/
│       ├── result/
│       └── validation/
└── tests/
    ├── unit/
    │   ├── domain/
    │   ├── application/
    │   └── presentation/
    ├── integration/
    │   ├── persistence/
    │   ├── playback/
    │   └── export/
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

## Decisions resolved during implementation

- Zod validates and parses all external project JSON. A migration entry point upgrades unversioned legacy files before validation.
- The current web repository uses `localStorage`, with a previous-version recovery snapshot. This keeps the first personal MVP dependency-free; IndexedDB remains an upgrade path if measured project sizes require it.
- History uses immutable full-project snapshots plus serializable operation records. This favors exact, trustworthy undo/redo over premature patch compression.
- MIDI Type 1 serialization is implemented locally because the MVP event vocabulary is intentionally small. An independent test parser verifies header format, timing division, track count, and track names.
- Tauri v2 is implemented behind the same repository and portable-file ports. Runtime platform detection selects browser or Tauri adapters without changing domain, application, or presentation code.
- The Tauri filesystem adapter stores editable projects in application-local data. Native open/save dialogs are used only for explicit portable JSON and MIDI operations.
- Tauri capabilities grant only core defaults, explicit dialogs, and recursive access to application-scoped storage. Dialog-selected paths receive the platform's scoped access.
- The macOS application bundle uses the same production Vite build and passed a local debug bundle smoke build. The configuration is portable to Windows, whose packaged smoke test belongs in Windows CI.

## Remaining technical decisions

- A richer playback scheduler or audio library if the simple Web Audio oscillator implementation becomes limiting.
- IndexedDB migration if profiling demonstrates that browser projects exceed practical `localStorage` limits.
- Notation or lead-sheet export beyond MIDI.

## Decision 016 — Commercial reference songs use local licensed assets

**Status:** Accepted

- Commercial song titles and artists may be registered as reference-test metadata.
- Copyrighted lyrics and MIDI arrangements are not copied into or distributed with the repository.
- A developer who is authorized to use those assets can place them under ignored, deterministic local paths and run an explicit validator.
- CI uses a complete original composition fixture so the lyrics, JSON import, phrase projection, arrangement, and multitrack MIDI paths remain fully testable without private assets.
- Generated original JSON and MIDI are checked against the canonical fixture factory to prevent drift.

## Decision 017 — Footer transport plays a compact song preview

**Status:** Accepted

- The footer transport uses explicit `Play song` and `Stop` labels in addition to familiar icons.
- Full-song preview is projected from the canonical phrases, chords, tempo, and active arrangement tracks through the playback port.
- Muted tracks are excluded. If any track is soloed, only unmuted solo tracks are scheduled.
- Structurally empty sections are skipped during interactive preview so incomplete projects sound immediately; canonical section timing remains unchanged for project data and MIDI export.
- Harmony, bass, rhythm, and melody-guide roles receive distinct lightweight Web Audio timbres. This is an audition skeleton, not a final mix.

## Decision 018 — Application chrome is viewport-fixed

**Status:** Accepted

- The project header and transport footer are fixed to the top and bottom of the viewport.
- The phase rail fills the space between them and remains stationary during composition.
- The primary workspace canvas and contextual inspector own their scrolling independently.
- The project library owns its own scroll container so fixed chrome never overlaps its content.
- Shared height tokens keep the offsets and available workspace height synchronized.

## Decision 019 — Built-in examples are complete editable projects

**Status:** Accepted

- The starting-page Examples section is driven by a reusable example catalog and card component.
- Every example is a schema-valid `CompositionProject`, not a separate demo-only data model, so all normal workspaces and exporters visualize the same canonical decisions.
- Opening an example seeds it into local persistence once. Later artist edits are preserved instead of being overwritten by the original seed.
- Example metadata describes its theme and completed phases, while the project carries the actual story, frame, emotional arc, structure, phrases, harmony, alternatives, tracks, and operation trail.
- Complete examples must fill every declared section duration and pass schema, MIDI, component, application, E2E, and visual checks.

## Decision 020 — Structure templates are versioned, non-destructive domain data

**Status:** Accepted

- The local template library covers story arc, direct pop, AABA, folk ballad, classic rock, 12-bar blues, build-and-drop, through-composed, and a blank canvas.
- Templates are versioned domain data rather than hard-coded presentation buttons, so the same definitions can support previews, future migrations, and reference metadata.
- Selecting a template is a non-mutating preview. The artist must explicitly apply it.
- The Structure workspace shows only the selected template during normal editing. A dedicated change action temporarily reveals the complete card library and collapses it again after selection.
- The most recent template-application operation identifies the form currently applied to the song. Its Apply action stays hidden, persists across reopen, reappears on undo, and hides again on redo.
- Applying a template is one undoable project operation. Existing phrases are reassigned by relative song position rather than deleted, and phrase order is normalized within each destination section.
- Existing emotional-arc intensity is projected by relative song position onto every new section.
- Repeated sections retain explicit source-section links, while every generated section remains independently editable.
- Changing composition phases resets the canvas and inspector scroll positions so a newly selected workspace opens at its beginning.
