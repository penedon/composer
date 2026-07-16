# Composition Overview — Product Analysis and Implementation Plan

## Objective

Turn `design/screens/18-composition-overview.svg` into the landing view for the Compose phase without creating a second source of truth for composition state.

The overview should answer three questions:

1. What artistic and musical choices currently shape the song?
2. Where does authored material exist across the structure?
3. Where can the artist resume work?

The canonical `CompositionProject` remains the only persisted source of truth. The overview is a read-only projection except for explicit navigation and playback actions.

## Audit summary

Most of the dashboard is supported by the current project model. Story blocks, musical frame, emotion points, sections, phrases, chords, tracks, selection, and playback already exist.

Several labels in the SVG go beyond the implemented product:

- `17 / 23 phrases` and `74%` imply target phrase counts that do not exist.
- `Open decisions` implies persisted tasks or decisions that do not exist.
- `Next best step` implies a recommendation engine and a judgment about the artist's work.
- `Recent phrase` cannot be derived reliably because operation records do not identify their target entity.
- `Point of view`, `Ending`, and `Intimate → wide` are not explicit fields in the canonical project.
- the transport scrubber and current bar require playback-position events that the playback port does not expose.
- the nested `Composition` navigation in the SVG duplicates the phase rail and is not part of the current route model.

The first implementation should therefore be a truthful dashboard projection, not a schema expansion.

## Element decisions

| SVG element | Current source | Decision |
|---|---|---|
| Project title and local save state | `CompositionProject.title`, project store | Keep as implemented shell behavior. |
| Story intent | `story: NarrativeBlock[]` | Keep. Use the `Premise` block when present, otherwise the first non-empty block. Do not invent a new summary field. |
| Point of view and ending | No explicit fields | Omit in the first release. Show labeled story blocks such as `Turning point` or `Resolution` only when the artist created them. |
| Key, tempo, meter, groove, genre | `MusicalFrame` | Keep and render exact canonical values. The SVG's `Indie ballad` must not replace the current `Alternative rock` value. |
| `Intimate → wide` | No aggregate field | Omit. Phrase dynamics may be summarized later, but they are not a canonical song-level arc. |
| Emotional curves | `emotionPlan.featured` and `emotionPlan.points` | Keep. Reuse the semantics and calculations of `EmotionCurve` in a compact read-only mode. |
| Structure blocks | `sections` | Keep. Preserve section names, order, colors, bar counts, and source variation links. |
| Phrase counts by section | `phrases` | Keep as counts of actual phrase blocks. Do not display an invented target count. |
| Progress percentage | Derivable only with a defined rule | Replace with `structure coverage`: authored phrase bars divided by section bars, capped per section. Label it as coverage, not song quality or completion. |
| Harmony sequence | `Phrase.chords` and `analyzeChord` | Keep for the focused phrase or section. Use existing plain-language harmonic functions and tension values. |
| Roman numeral sequence | Only partially supported | Omit until harmonic analysis can derive every numeral correctly in key context. |
| Tension path | Derivable with `analyzeChord` | Keep as an informational projection for the focused phrase. Do not claim that the final chord is unresolved without a stronger contextual rule. |
| Rhythm and dynamics | `Phrase.rhythm`, `Phrase.dynamics` | Keep for the focused phrase. |
| Current phrase card | `selectedPhraseId` | Keep, renamed from `Recent phrase` to `Selected phrase`. Fall back deterministically when no valid phrase is selected. |
| Arrangement seeds | `tracks` | Keep. Render exact track role, name, and instrument. The current seed uses `Brush kit`, not `Brushes`. |
| Open decisions | No canonical task model | Replace with factual `Composition checks`: sections without material, empty phrase blocks, and sections with uncovered bars. |
| Next best step | No recommendation policy | Replace with `Continue composing`. Navigate to the selected section, or a deterministic fallback section. Do not present the fallback as artist advice. |
| Compose sub-navigation in phase rail | No matching route or shell contract | Do not add it to `PhaseRail`. Use local `Overview` and `Phrases` navigation inside the Compose workspace. |
| Transport play/stop, tempo, meter, key | Store and playback port | Keep the current persistent `TransportBar`. |
| Scrubber, current bar, seek | Not supported by `PlaybackEngine` | Defer until playback exposes duration, position, seek, and section/phrase position events. |
| Completed-phase checkmarks | No completeness query | Keep the current numbered phase rail until phase-completeness rules are defined. |

## Product rules for the first release

### Material and coverage

A phrase counts as authored material when at least one of the following is true:

- it contains non-whitespace lyrics;
- it contains a chord event;
- it was explicitly created as an instrumental phrase.

For each section:

```text
authored bars = sum of bars for phrases containing authored material
covered bars  = min(section bars, authored bars)
coverage      = covered bars / section bars
```

Project structure coverage is the sum of covered section bars divided by total section bars. It must be labeled `structure coverage`, never `song completion`.

The UI should also expose unambiguous raw counts:

- sections containing material;
- phrase blocks;
- chord events;
- arrangement tracks.

### Focus and resume behavior

The focused section is selected in this order:

1. a valid `selectedSectionId` from the current session;
2. the first section with less than full structural coverage;
3. the first project section.

The focused phrase is selected in this order:

1. a valid `selectedPhraseId` within the focused section;
2. the first phrase in the focused section;
3. no phrase summary.

`Continue composing` opens the focused section. This is navigation continuity, not a recommendation about what the artist should write.

### Composition checks

Checks are deterministic observations only:

- section has no authored material;
- section has authored bars below its configured bar count;
- phrase block has no lyrics, chord events, or instrumental intent;
- project has no arrangement tracks.

Checks must include the exact reason and a target link. They must never rewrite content, select a chord, or rank artistic quality.

## Architecture

### Read model

Add a pure application query that projects a `CompositionProject` and optional session focus into a presentation-ready model.

Suggested location:

```text
src/main/application/queries/compositionOverview.ts
src/tests/unit/application/queries/compositionOverview.spec.ts
```

Suggested public shape:

```ts
interface CompositionOverview {
  story: {
    primaryBlock: NarrativeBlock | null
    supportingBlocks: NarrativeBlock[]
  }
  frame: MusicalFrame
  emotions: Array<{
    emotion: FeaturedEmotion
    points: Array<{ sectionId: string; intensity: number }>
  }>
  sections: Array<{
    section: SongSection
    phraseCount: number
    authoredBars: number
    coveredBars: number
    coverage: number
  }>
  totals: {
    sectionCount: number
    sectionsWithMaterial: number
    phraseCount: number
    chordCount: number
    trackCount: number
    structureCoverage: number
  }
  focus: {
    section: SongSection | null
    phrase: Phrase | null
    harmonicEvents: Array<{
      chord: ChordEvent
      functionLabel: string
      plainLanguage: string
      tension: number
    }>
  }
  tracks: ArrangementTrack[]
  checks: CompositionCheck[]
}
```

The query must remain pure, deterministic, and independent of Vue. It must not mutate the project or write operation records.

### Routing

Align the router with the already accepted architecture contract:

```text
/projects/:projectId/compose                 # overview
/projects/:projectId/compose/:sectionId      # phrase workspace for a section
```

Implementation notes:

- define the Compose route separately before the generic phase route;
- remove `compose` from the generic phase matcher;
- keep the Compose phase-rail link pointed at `/compose`;
- synchronize a valid `sectionId` route param into `selectedSectionId`;
- redirect an invalid section ID to the overview without mutating the project;
- keep phrase selection as transient store state for the first release.

No project schema migration is required.

### Presentation ownership

Keep `ComposeWorkspace` as the route-level owner and split its two semantic views:

```text
src/main/presentation/workspaces/ComposeWorkspace/
├── ComposeWorkspace.vue               # route/view orchestration
├── ComposeWorkspace.scss
├── CompositionOverview.vue            # overview canvas
├── CompositionOverview.scss
├── PhraseEditor.vue                    # current phrase-workspace content
└── PhraseEditor.scss
```

Private view components may remain in the workspace folder. Promote a component only when a second real consumer needs it.

Extend `EmotionCurve` with explicit compact/read-only behavior rather than copying its path logic into a dashboard-only chart. Keep keyboard sliders and editable controls in the Emotions workspace; the compact overview needs an accessible text summary instead.

Do not reuse the interactive `PhraseBlock` as a read-only card. A focused-phrase summary has different behavior and should remain private to the overview until another consumer appears.

### Inspector

The current inspector is generic and owned by `WorkspacePage`. Add a phase/view-specific inspector selection there rather than allowing a child workspace to reach into shell layout.

The first overview inspector should contain:

- exact project counts;
- deterministic composition checks;
- exact arrangement tracks;
- a `Continue composing` action.

The Phrase editor can retain the existing project-intent inspector until a dedicated active-phrase inspector is implemented.

## Delivery plan

### Phase 1 — Reconcile the design contract

Deliverables:

- revise the SVG copy and example values according to the element decisions above;
- remove fictional phrase targets and unsupported transport behavior;
- rename `Recent phrase`, `Open decisions`, and `Next best step`;
- document the structure-coverage definition in the SVG description or companion notes.

Exit criteria:

- every displayed value is canonical, session-derived, or backed by a documented pure rule;
- the design does not imply a mutation or recommendation that the product cannot perform.

### Phase 2 — Implement and test the overview query

Deliverables:

- pure `compositionOverview` query;
- phrase-material predicate and section-coverage calculation;
- focus fallback rules;
- deterministic composition checks;
- harmonic projection through the existing `analyzeChord` function.

Tests:

- empty project;
- partially authored project;
- fully covered structure;
- phrase bars exceeding section bars;
- empty and instrumental phrases;
- invalid selected section and phrase IDs;
- no story, emotion, chord, or track data;
- stable output for the same input;
- proof that the input project is not mutated.

Exit criteria:

- all dashboard text and metrics can be supplied without calculations in Vue components;
- no schema or persistence change is introduced.

### Phase 3 — Add Compose overview routing

Deliverables:

- overview and section-specific Compose routes;
- route-to-selection synchronization;
- local `Overview` / `Phrases` navigation;
- `Continue composing` target resolution;
- safe invalid-section fallback.

Tests:

- direct load of both Compose URLs;
- browser back/forward behavior;
- phase-rail Compose navigation returns to overview;
- opening a section selects the same canonical section;
- invalid IDs do not change or delete project data.

Exit criteria:

- Compose has a durable overview URL and durable section URLs;
- the current phrase editor remains behaviorally unchanged.

### Phase 4 — Build the dashboard canvas

Deliverables:

- story and musical-frame summary cards;
- compact read-only emotion/structure chart;
- section coverage and raw-count summaries;
- focused harmony/rhythm projection;
- selected phrase summary with existing playback actions;
- responsive Studio Notebook layout at `1440 × 1024` and `1280 × 800`.

Interaction rules:

- edit links navigate to the owning phase rather than editing canonical data inline;
- clicking a section opens its phrase workspace;
- chord labels remain informational in the overview;
- play and loop use existing store playback actions;
- color remains paired with text, values, or line identity.

Exit criteria:

- the overview is useful when data is complete, partial, or empty;
- it introduces no alternative editing path for canonical fields.

### Phase 5 — Add the overview inspector

Deliverables:

- phase/view-specific inspector selection in `WorkspacePage`;
- composition counts;
- deterministic checks with target links;
- arrangement-track summary;
- `Continue composing` action.

Exit criteria:

- every check explains why it exists;
- no check is framed as a quality score or mandatory correction;
- the generic inspector still renders for the other phases.

### Phase 6 — Acceptance and visual protection

Component and integration coverage:

- accessible names for cards, chart summary, progress, and actions;
- keyboard navigation through local tabs, edit links, section links, and playback;
- no project mutation when opening the overview;
- exact rendering of canonical frame, emotion, phrase, chord, and track data.

End-to-end coverage:

- open a partial project and verify truthful counts;
- navigate overview → section phrase editor → overview;
- play the selected phrase without changing the project;
- edit Story, Frame, Emotions, Structure, Phrase, and Arrangement data, then verify the overview updates;
- reload the project and verify derived metrics are identical;
- axe accessibility audit;
- visual baselines at both approved desktop sizes.

Release checks:

```sh
npm run typecheck
npm run lint -- --quiet
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
```

## Deferred work

The following should not block the first dashboard release:

- persisted composition tasks or artist-authored decisions;
- phase completion checkmarks;
- recent-entity history based on structured operation targets;
- song-level dynamics or instrumentation arcs;
- contextual cadence and phrase-transition analysis;
- normative `next best step` recommendations;
- transport position, seeking, and bar-level playhead;
- user-configurable phrase targets;
- dashboard-specific persistence fields.

Each deferred item needs its own product rule and, if persisted, a versioned schema migration.

## Principal risks and controls

| Risk | Control |
|---|---|
| Dashboard metrics are mistaken for artistic quality | Use factual labels such as `structure coverage`; never use a score, grade, or completion claim. |
| Derived rules drift across components | Put all calculations in one pure application query and unit test it. |
| Overview becomes a second editor | Use navigation links for edits and keep mutations in their owning workspaces. |
| Route changes regress Phrase Workspace | Preserve the existing editor behind the section route and run its current E2E journeys unchanged. |
| Dense dashboard is inaccessible | Add a text summary for charts, preserve keyboard order, pair color with labels, and test both desktop sizes. |
| Harmonic analysis overstates certainty | Show existing plain-language function and tension data only; defer cadence claims. |
| Fictional sample values leak into product | Render exclusively from the active project and use canonical fixtures in tests. |

## Definition of done

The composition overview is complete when:

- `/projects/:projectId/compose` renders a truthful summary of the active canonical project;
- every metric has a documented deterministic definition;
- the artist can reach the owning workspace for every summarized element;
- the artist can resume a section and audition the selected phrase;
- opening or navigating the overview never mutates the project;
- partial and empty projects have useful states;
- existing Story, Frame, Emotions, Structure, Phrase, Arrange, Export, undo, autosave, and playback journeys still pass;
- accessibility, visual regression, unit, integration, typecheck, lint, and build checks pass.
