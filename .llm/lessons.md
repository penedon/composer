# Development Lessons and Product Decisions

This document records decisions and lessons established while defining Composer. It is a durable reference for future implementation work.

## Product purpose

- The first user is an amateur musician who can play some instruments but does not yet consider himself a composer.
- The application exists to create clarity between an artistic idea and a playable song skeleton.
- Composer assists the artist; it does not replace the artist.
- The defining workflow is:

  ```text
  Story -> Musical frame -> Emotions -> Emotional arc -> Structure
        -> Phrase composition -> Arrangement -> MIDI export
  ```

- The product is not intended to become a full DAW.
- Individual capabilities exist in other music tools, but Composer differentiates itself by keeping narrative and emotional intent connected to musical decisions throughout the workflow.

## Artist ownership

- The artist writes the story and lyrics.
- The application must not generate, rewrite, or judge lyrics as part of the core product.
- Narrative templates are optional organizational aids, not mandatory forms.
- Useful optional narrative labels include premise, narrator, conflict, turning point, climax, and ending.
- Genre is chosen by the artist. The application may explain likely implications for tempo, meter, rhythm, structure, harmony, and instrumentation.
- Suggestions must be requested by the artist and presented as alternatives rather than correct answers.
- Every suggestion should be explainable and auditionable.
- Existing artist work must never be silently overwritten by a downstream recommendation.

## Emotion model

- There is no universally accepted scientific list of major emotions. The application must not present its taxonomy as objective truth.
- Composer will use an original, extensible product taxonomy informed by established emotion research.
- The initial major families are:

  1. Joy
  2. Love and connection
  3. Sadness
  4. Fear
  5. Anger
  6. Disgust and rejection
  7. Surprise and wonder
  8. Anticipation and desire

- The artist selects one dominant family and up to three featured specific emotions.
- A specific emotion may belong to multiple families with different weights; the model is a graph, not a strict folder hierarchy.
- Emotions may also carry continuous descriptive properties such as valence, arousal, power/control, and novelty.
- Emotional labels and dimension values are expressive aids, not diagnoses or absolute measurements.
- Clinical or sustained-state terms such as "depressed" require care; more precise artistic terms such as melancholy, despair, emptiness, hopelessness, or numbness should be offered.
- Multiple emotions can coexist within a section.
- The Emotional Arc Builder visualizes the intensity of featured emotions across song sections.
- Published research instruments may inform the product, but their exact scales, layouts, and licensed assets must not be copied without permission.

## Music model and guidance

- The MVP centers on Western tonal harmony.
- The architecture must leave room for other tuning systems, scales, rhythmic traditions, and instruments, including Brazilian Indigenous and Eastern musical exploration.
- Western assumptions must not be scattered through presentation components; they belong behind explicit domain concepts and strategy interfaces.
- A chord does not have a universal emotional value.
- Tension and release depend on context, including key, preceding and following harmony, voicing, bass motion, duration, melody, rhythm, register, and performance.
- Harmonic guidance should evaluate transitions and phrases rather than permanently labeling isolated chords.
- The interface should lead with plain-language function such as home, departure, pull, tension, partial release, and resolution.
- Conventional theory labels such as Roman numerals, cadence names, borrowed chords, and secondary dominants remain available as supporting detail.
- Rhythm is a first-class musical concept. Tempo, meter, groove, accent, syncopation, note duration, and harmonic rhythm can change the character of the same harmony.
- Initial playback is intentionally modest: chords, tempo, metronome, harmonic rhythm, simple rhythm patterns, and a neutral instrument.
- Playback realism is less important than fast, reliable audition during the MVP.

## Phrase Workspace

- Composer does not embed Jupyter, run notebook kernels, use notebook files, or copy the Jupyter interface.
- Composer borrows one useful interaction principle: work in small ordered blocks, audition the current block, and advance.
- The original UI concept is named **Phrase Workspace**. A unit is a **phrase**, not a notebook cell.
- A phrase may contain lyrics, chord positions, timing, rhythm, emotional intention, dynamics, performance notes, and alternatives.
- Instrumental phrases are supported.
- `Shift+Enter` auditions the current phrase and advances focus to the next phrase.
- Additional playback actions include play phrase, play with lead-in, loop phrase, and play section.
- Phrase playback must be deterministic and must never depend on hidden execution order.
- Visible playback context includes key, tempo, meter, groove, section, and preceding harmony.
- Phrase boundaries organize the writing experience but do not impose rigid musical boundaries. Pickups, sustained chords, and transitions may cross phrase boundaries.
- The canonical musical timeline remains the timing source of truth.
- Phrase Workspace and Arrangement are two views over the same project data.

## Structure, alternatives, and history

- The application provides structure templates and allows completely manual structures.
- Reference songs may later be associated with structures, but large public-data ingestion is not an MVP dependency.
- Reference data must distinguish verified facts, computational inference, community annotation, and subjective emotional labels.
- Sections may repeat while retaining links to their source section.
- A repeated section may vary lyrics, harmony, rhythm, emotional intensity, instrumentation, or dynamics.
- Undo is required.
- Named alternatives are required for safe comparison of different expressive choices.
- Transformations should be recorded as intentional operations rather than arbitrary component mutations.

## Persistence and export

- The application is local-first.
- The web MVP does not require accounts, S3, cloud storage, or a backend.
- Browser storage provides autosave; JSON import/export provides portable project files.
- The Tauri shell provides native filesystem dialogs and application-local storage while reusing the canonical project model on macOS and Windows.
- Canonical JSON is the project source of truth.
- MIDI is an export format, not the editable project format.
- MIDI cannot preserve the complete story, emotional arc, explanations, alternatives, visual state, and application history.
- MIDI export must separate tracks by instrument so a musician can isolate, edit, process, and mix them in a DAW.
- Project files require explicit schema versioning and migrations.

## Interface and visual design

- The visual direction is **Studio Notebook**.
- Writing and lyric surfaces are warm and readable; structure and transport use a low-glare shell.
- Emotion colors are semantic and consistent across the product.
- Color must always be paired with labels, line identity, shapes, or values.
- The primary desktop frame contains a project bar, phase rail, primary canvas, contextual inspector, and persistent transport.
- The guided phase rail is navigation, not a locked wizard.
- Contextual complexity is preferred over dense permanent DAW chrome.
- Theory should be progressively disclosed.
- Story Workspace, Emotional Arc Builder, and Phrase Workspace established the first coherent design language.

## Frontend implementation discipline

- The frontend uses Vue 3, Vite, TypeScript, and the Composition API.
- Production code and tests use separate source sets: `src/main` and `src/tests`.
- Test paths mirror production paths.
- Each component has its own folder.
- A component folder owns its `.vue`, types, composable/controller code, styles, and public `index.ts` as needed.
- Test files are placed in the mirrored component folder under `src/tests`, not in `src/main`.
- Do not create a second component merely because it needs one additional capability.
- Enrich the existing component when the semantic responsibility remains the same.
- Prefer props, slots, typed emits, composables, and small internal subcomponents over copy-and-modify variants.
- Reuse does not mean building a single universal mega-component. Split components when responsibilities and semantics genuinely differ.
- Business rules do not belong in Vue components, Pinia stores, browser adapters, or SCSS.
- Components emit user intent; application use cases perform mutations.

## End-to-end vision protection

- End-to-end tests are required product acceptance criteria, not optional release polish.
- The tests must prove that the implemented application preserves the approved workflow and design intent.
- Critical journeys must cover story, emotions, arc, structure, Phrase Workspace, arrangement, persistence, undo, alternatives, and MIDI export.
- The Phrase Workspace must be tested as an original deterministic musical interface, not as a notebook runtime.
- `Shift+Enter` must audition the current phrase and advance without introducing hidden state.
- Suggestions must never alter the project until the artist explicitly accepts them.
- Phrase and Arrangement views must remain synchronized because they are projections of one canonical project.
- Browser save/reopen and recovery must work without an account or cloud service.
- MIDI downloads must contain separate instrument tracks.
- Visual regression tests at the approved desktop sizes protect the Studio Notebook design language.
- Visual checks complement behavioral assertions; screenshots alone are not sufficient acceptance tests.
- Accessibility behavior, including keyboard-only operation and color-independent meaning, is part of end-to-end acceptance.
- E2E fixtures must use deterministic IDs, clocks, and seeded project data to prevent flaky tests.

## Implementation lessons

- Shared identifiers used by domain operations belong in the domain shared kernel. Import-boundary tests caught the original outward `@main` dependency and now prevent regressions.
- Pinia computed state that wraps non-reactive application services must read a reactive revision before evaluating the service getter. A short-circuited service check can otherwise prevent Vue from tracking the revision.
- Vitest discovery must explicitly include only `src/tests/unit` and `src/tests/integration`; Playwright specifications under `src/tests/e2e` must never be loaded by Vitest.
- Multiple `aside` landmarks need distinct accessible names. The E2E axe audit caught the ambiguous navigation and context landmarks.
- Chord suggestion audition and acceptance are separate events. Audition calls playback only; canonical mutation happens only through the explicit “Use chord” action.
- Browser audio may be unavailable in automated/headless contexts. Playback degrades safely without changing the deterministic playback request or project state.
- Web and native persistence implement the same application ports. `isTauri()` chooses adapters once at bootstrap, keeping platform checks out of components and domain code.
- Tauri's dev URL and Vite's configured port must agree. Playwright can still override that port for isolated test servers.
- Tauri requires a raster application icon during context generation even for `cargo check`; the checked-in SVG is the source and the PNG is its generated bundle asset.
- A recovery snapshot is written before replacing an existing saved project in both browser and native repositories.
- Visual baselines cover story, emotion arc, structure variation, active phrase/suggestions, arrangement, and export. Behavioral assertions accompany them in the same journey.
- Famous commercial songs are useful compatibility references, but their full lyrics and MIDI arrangements must remain user-supplied licensed assets rather than repository fixtures.
- A complete original reference song provides stronger deterministic coverage: its canonical JSON, artist-authored-style lyrics, section projections, four instrument tracks, and generated Type-1 MIDI are all versioned and tested together.
- Generated fixture artifacts need a reproducible command and synchronization tests. `npm run fixtures:generate` is the only source of the checked-in original JSON/MIDI pair.
- Transport icons must communicate and implement the same action. A standalone square is a stop symbol, not a play control; the persistent footer now exposes an explicit `Play song`/`Stop` state and calls a real full-arrangement playback port.
- Full-song preview skips structurally empty sections so a partially composed project produces audible feedback immediately, while MIDI export continues to preserve canonical section timing.
- Persistent creation tools should not disappear while editing a long emotional arc or phrase list. The header, phase rail, and transport are viewport-fixed; only the creative canvas and inspector scroll.
- Fixed chrome must reserve its space through shared CSS height tokens rather than duplicated pixel offsets, or content will slide beneath the header/footer when either changes.
- A useful example must be a real canonical project rather than a decorative mock. Opening `The Long Road Within` exposes the exact same Story, Frame, Emotions, Structure, Compose, Arrange, and Export workspaces used for an artist’s own song.
- Built-in examples are seeded only when absent. Treating the first open as a local copy lets the user experiment without a later visit silently discarding those edits.
- Example cards summarize the theme, scale, and completed decision path before opening, so the starting page teaches the workflow rather than presenting an unexplained sample file.
