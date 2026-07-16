# Composer UI Design Implementation Plan

## Product direction

Composer is a local-first, beginner-friendly songwriting workspace that helps an artist move from narrative intent to an emotionally coherent, playable arrangement.

The product is not a reduced DAW and it is not a Jupyter interface. It uses an original **Phrase Workspace** inspired by the useful interaction principle of notebook software: work in small ordered blocks, audition the current block immediately, and advance without losing context.

The canonical project remains deterministic. A phrase is always part of the song timeline; playback never depends on hidden or out-of-order execution state.

## Primary experience

```text
Story
  -> Musical frame
  -> Emotion palette
  -> Emotional arc
  -> Song structure
  -> Phrase Workspace
  -> Arrangement
  -> JSON save / multitrack MIDI export
```

The sequence is guidance, not a wizard. The artist may skip optional steps or return to any earlier phase.

## Phrase Workspace

Each phrase block can contain:

- lyric text;
- chords positioned over words or syllables;
- bar and beat duration;
- rhythm or groove assignment;
- emotional intention and intensity;
- dynamics and performance notes;
- instrumental-only content;
- named alternatives.

Primary phrase actions:

- `Shift+Enter`: audition the phrase and move to the next phrase;
- play phrase;
- play with harmonic lead-in;
- loop phrase;
- play the containing section;
- duplicate or reorder;
- create and compare alternatives;
- undo.

Phrase boundaries organize the writing process but do not impose rigid musical boundaries. Chords, pickups, sustains, and transitions may cross phrases.

## Shared application anatomy

All main workspaces use the same frame:

1. Project bar — title, save state, undo/redo, project actions.
2. Phase rail — Story, Frame, Emotions, Structure, Compose, Arrange, Export.
3. Primary canvas — the current creative task.
4. Context panel — selected-object properties, explanations, and requested suggestions.
5. Transport — playback, loop, tempo, meter, and current position.

## Visual language

The working concept is **Studio Notebook**:

- warm, readable writing surfaces;
- low-glare structural shell and transport;
- emotion colors reserved for semantic data;
- track colors secondary to readable instrument labels;
- theory explained in plain language before symbolic detail;
- stable placement of project navigation and playback;
- progressive disclosure for advanced theory;
- color always paired with labels, shapes, or line styles.

Desktop reference frame: `1440 x 1024`.

Minimum intended working size: `1280 x 800`.

## Artifact inventory

### Foundations

| ID | Artifact | Purpose |
|---|---|---|
| 00 | `design-system.svg` | Tokens, components, emotion encoding, musical marks |
| 01 | `experience-map.svg` | End-to-end flow, optional paths, shared project model |
| 02 | `application-anatomy.svg` | Persistent navigation, canvas, inspector, and transport |
| 03 | `competitive-patterns.svg` | Patterns adopted, adapted, and deliberately avoided |

### Project and intent screens

| ID | Artifact |
|---|---|
| 04 | Project library |
| 05 | New project |
| 06 | Story Workspace |
| 07 | Optional narrative template |
| 08 | Genre and musical frame |
| 09 | Major emotion wheel |
| 10 | Specific-emotion selection |
| 11 | Emotion detail and custom emotion |
| 12 | Emotional Arc Builder |
| 13 | Mixed-emotion section state |
| 14 | Structure-template library |
| 15 | Structure comparison |
| 16 | Structure builder |
| 17 | Repeated-section variation |

### Composition and arrangement screens

| ID | Artifact |
|---|---|
| 18 | Composition overview |
| 19 | Phrase Workspace |
| 20 | Lyric phrase editing state |
| 21 | Chord placement state |
| 22 | Requested chord suggestions |
| 23 | Harmonic-function view |
| 24 | Tension and release visualization |
| 25 | Rhythm laboratory |
| 26 | Instrument browser |
| 27 | Arrangement timeline |
| 28 | Track controls and routing |
| 29 | Phrase/section alternative comparison |
| 30 | History and checkpoints |

### Persistence and support screens

| ID | Artifact |
|---|---|
| 31 | Save and local project status |
| 32 | Multitrack MIDI export |
| 33 | Reopen and autosave recovery |
| 34 | Contextual theory guidance |
| 35 | Empty, invalid, disabled, and error states |

### Flow boards

1. Guided first composition.
2. Freeform composition.
3. Emotion revision and downstream review.
4. Phrase audition and chord discovery.
5. Repeated-section variation.
6. Local save, reopen, recovery, and export.

## Implementation phases

### Phase A — Validate the design language

- Build the design-system board.
- Build the experience map.
- Build Story Workspace.
- Build Emotional Arc Builder.
- Build Phrase Workspace.
- Assemble an initial visual atlas.

Exit criterion: story writing, emotional planning, and phrase composition feel like one product.

### Phase B — Complete the guided path

- Project library and creation.
- Musical frame.
- Emotion selection states.
- Structure templates and builder.
- Composition overview.

Exit criterion: every step from a new project to the first playable phrase is represented.

### Phase C — Complete musical exploration

- Chord placement and suggestion states.
- Harmonic function and tension views.
- Rhythm laboratory.
- Instrument selection.
- Alternatives and history.

Exit criterion: the artist can explore without destructive edits or unexplained theory.

### Phase D — Complete arrangement and persistence

- Arrangement and track screens.
- Save, recovery, and export.
- Guidance and system states.
- All flow boards.

Exit criterion: the design covers the complete local project lifecycle and multitrack MIDI handoff.

## SVG production rules

- Every artifact is a standalone SVG suitable for browser viewing and Figma import.
- No external fonts, images, stylesheets, or shared runtime dependencies.
- Every SVG includes `title` and `desc` accessibility elements.
- Component geometry and tokens remain consistent across files.
- Important states receive separate frames rather than ambiguous annotations.
- Text must remain legible at the reference canvas size.
- Artifacts are rendered to raster previews during verification to detect clipping and layout errors.

## Current execution status

- [x] Product direction updated for Phrase Workspace.
- [x] Artifact inventory updated.
- [x] Initial foundation boards implemented.
- [x] Representative Phase A screens implemented.
- [x] Initial atlas assembled and visually verified.
- [x] Composition Overview drafted and audited; see [`COMPOSITION_OVERVIEW_PLAN.md`](./COMPOSITION_OVERVIEW_PLAN.md).
- [ ] Remaining screens implemented.
