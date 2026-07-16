# Music Composition Sandbox — Project Plan

## Vision

Build a local-first, backend-independent music composition platform that allows musicians and external AI assistants to collaboratively explore musical ideas.

The application itself is deterministic and contains **no AI integrations**. Instead, it exposes an AI-friendly project format that can be edited by any external LLM or tool.

The project follows **Directed Layers Architecture (DLA)**.

---

# Core Architectural Principle: Canonical Music Model

The heart of the platform is a **Canonical Music Model**.

Every musical concept is represented semantically rather than by a specific technology.

Examples include:

- Song
- Section
- Track
- Pattern
- Note
- Chord
- Rhythm
- Tempo
- Scale
- Instrument

No entity should contain Renardo, MIDI, or DAW-specific concepts.

Every backend translates this canonical representation into its own implementation.

This makes every technology interchangeable:

```text
Canonical Music Model
        |
        +-- Renardo
        +-- MIDI
        +-- MusicXML
        +-- FL Studio
        +-- Ableton
        +-- REAPER
        +-- Future backends
```

Changing or adding a backend must never require changes to business logic.

---

# Use Cases

The following use cases define the expected behavior of the application. They are intentionally written around the Canonical Music Model and DLA, not around Renardo or any single backend.

---

## Use Case 1 — Create a New Song Sketch

### Goal

Create a minimal song project with metadata, tempo, key, empty sections, and empty tracks.

### User Flow

```text
composer new water_dream --tempo 92 --key "D minor"
```

### Expected Result

```text
projects/water_dream/
    project.yaml
    ai_notes.md
    exports/
```

### Example Project File

```yaml
metadata:
  title: water_dream
  author: Gustavo
  description: A mysterious water-inspired sketch.

tempo: 92
key: D minor
time_signature: 4/4

sections:
  - id: intro
    bars: 4

tracks:
  - id: piano
    type: harmony
    instrument: soft_piano
    patterns: []
```

### DLA Flow

```text
presentation -> business -> service -> interfaces/filesystem
```

### Example Business Use Case

```python
from main.entities.song import Song
from main.service.project_service import ProjectService


class CreateSongSketch:
    def __init__(self, project_service: ProjectService):
        self.project_service = project_service

    def execute(self, title: str, tempo: int, key: str) -> Song:
        song = Song.new(title=title, tempo=tempo, key=key)
        self.project_service.save(song)
        return song
```

---

## Use Case 2 — Load an AI-Editable Project File

### Goal

Load `project.yaml` into canonical entities.

External AI tools may edit the file, but the application only validates and loads it.

### User Flow

```text
composer load projects/water_dream/project.yaml
```

### Example Service

```python
from main.entities.song import Song
from main.service.providers.project_repository import ProjectRepository


class ProjectService:
    def __init__(self, repository: ProjectRepository):
        self.repository = repository

    def load(self, path: str) -> Song:
        return self.repository.load(path)
```

### Example Interface

```python
import yaml

from main.entities.song import Song


class YamlProjectRepository:
    def load(self, path: str) -> Song:
        with open(path, "r", encoding="utf-8") as file:
            raw_data = yaml.safe_load(file)

        return Song.from_dict(raw_data)
```

### DLA Rule

The YAML parser lives in `interfaces/filesystem`, not in `business`.

---

## Use Case 3 — Preview a Pattern in the Sandbox

### Goal

Allow the user to quickly hear an idea without opening a full DAW.

### User Flow

```text
composer sandbox
sandbox> load water_dream
sandbox> play piano
```

### DLA Flow

```text
presentation/sandbox_cli
    -> business/run_sandbox_session
    -> service/playback_service
    -> interfaces/renardo
```

### Example Business Use Case

```python
from main.service.playback_service import PlaybackService


class PreviewTrack:
    def __init__(self, playback_service: PlaybackService):
        self.playback_service = playback_service

    def execute(self, project_id: str, track_id: str) -> None:
        self.playback_service.preview_track(
            project_id=project_id,
            track_id=track_id,
        )
```

### Example Service

```python
from main.service.providers.playback_provider import PlaybackProvider


class PlaybackService:
    def __init__(self, playback_provider: PlaybackProvider):
        self.playback_provider = playback_provider

    def preview_track(self, project_id: str, track_id: str) -> None:
        self.playback_provider.play_track(project_id, track_id)
```

---

## Use Case 4 — Mutate a Pattern

### Goal

Create variations of an existing pattern while preserving the original musical identity.

### User Flow

```text
sandbox> mutate drums --density +0.15 --humanize 0.05
```

### Example Business Use Case

```python
from main.entities.pattern import Pattern
from main.service.pattern_service import PatternService


class MutatePattern:
    def __init__(self, pattern_service: PatternService):
        self.pattern_service = pattern_service

    def execute(self, pattern: Pattern, density: float, humanize: float) -> Pattern:
        mutated = self.pattern_service.adjust_density(pattern, density)
        mutated = self.pattern_service.humanize(mutated, amount=humanize)
        return mutated
```

### DLA Rule

The mutation operation returns a new canonical `Pattern`.

It does not export MIDI, generate Renardo code, or write files directly.

---

## Use Case 5 — Export a Song to MIDI

### Goal

Export the canonical song model to a `.mid` file that can be imported into a DAW.

### User Flow

```text
composer export midi projects/water_dream/project.yaml exports/water_dream.mid
```

### DLA Flow

```text
presentation -> business -> service -> interfaces/midi
```

### Example Business Use Case

```python
from main.service.export_service import ExportService


class ExportSongToMidi:
    def __init__(self, export_service: ExportService):
        self.export_service = export_service

    def execute(self, project_path: str, output_path: str) -> None:
        self.export_service.export(
            project_path=project_path,
            output_path=output_path,
            format="midi",
        )
```

### Example Service

```python
from main.service.providers.export_provider import ExportProvider


class ExportService:
    def __init__(self, midi_export_provider: ExportProvider):
        self.midi_export_provider = midi_export_provider

    def export(self, project_path: str, output_path: str, format: str) -> None:
        if format != "midi":
            raise ValueError(f"Unsupported export format: {format}")

        self.midi_export_provider.export(project_path, output_path)
```

---

## Use Case 6 — Export a Song to Renardo

### Goal

Generate Renardo-compatible source code from the canonical music model.

### User Flow

```text
composer export renardo projects/water_dream/project.yaml exports/water_dream.py
```

### Example Interface

```python
from main.entities.song import Song


class RenardoWriter:
    def write(self, song: Song) -> str:
        lines = []

        lines.append(f"Clock.bpm = {song.tempo}")

        for track in song.tracks:
            pattern_code = self._render_track(track)
            lines.append(pattern_code)

        return "\n".join(lines)

    def _render_track(self, track) -> str:
        return f"# Rendered Renardo pattern for {track.id}"
```

### DLA Rule

Renardo-specific syntax belongs only in `interfaces/renardo`.

---

## Use Case 7 — External AI Suggests a New Variation

### Goal

Allow an external AI to propose changes by editing project files, without the application calling AI services.

### User Flow

```text
External AI edits project.yaml
composer validate projects/water_dream/project.yaml
composer sandbox
sandbox> reload
sandbox> play chorus
```

### Example AI-Editable Patch

```yaml
sections:
  - id: chorus
    bars: 8
    notes:
      - "increase harmonic density"
      - "add syncopated piano rhythm"
```

### Application Responsibility

The application should:

- validate the file
- load supported fields
- warn about unsupported fields
- preserve human/AI notes where possible

### DLA Rule

AI is treated as an external author of project files, not as an internal dependency.

---

## Use Case 8 — Undo and Reproduce a Sandbox Session

### Goal

Allow safe experimentation by recording transformations as a history.

### User Flow

```text
sandbox> transpose piano +2
sandbox> humanize drums 0.03
sandbox> undo
sandbox> save
```

### Example History Entry

```yaml
history:
  - operation: transpose
    target: piano
    parameters:
      semitones: 2
  - operation: humanize
    target: drums
    parameters:
      amount: 0.03
```

### Example Pattern Operation

```python
from dataclasses import replace

from main.entities.pattern import Pattern


class TransposePattern:
    def execute(self, pattern: Pattern, semitones: int) -> Pattern:
        return replace(
            pattern,
            notes=[
                note.transpose(semitones)
                for note in pattern.notes
            ],
        )
```

### DLA Rule

Operations should prefer immutable transformations: input entity in, new entity out.

---

## Use Case 9 — Validate a Project

### Goal

Ensure project files are safe and compatible before playback or export.

### User Flow

```text
composer validate projects/water_dream/project.yaml
```

### Validation Ownership

| Validation Type | Owner |
|---|---|
| Structural/type validation | entities |
| External file shape validation | interfaces |
| Business rule validation | business |
| Cross-backend normalization | service |

### Example Business Rule

```python
class ValidateSongForExport:
    def execute(self, song) -> None:
        if not song.tracks:
            raise ValueError("Song must contain at least one track.")

        if song.tempo <= 0:
            raise ValueError("Tempo must be greater than zero.")
```

---

## Use Case 10 — Run a Composition Pipeline

### Goal

Allow composable, reproducible workflows.

### User Flow

```text
composer pipeline projects/water_dream/project.yaml \
  --steps normalize,humanize,validate,export-midi
```

### Pipeline Example

```text
Load Project
    ↓
Normalize
    ↓
Humanize
    ↓
Validate
    ↓
Preview
    ↓
Export MIDI
```

### Example Pipeline Stage

```python
from typing import Protocol

from main.entities.song import Song


class PipelineStage(Protocol):
    def execute(self, song: Song) -> Song:
        ...
```

### Example Pipeline Runner

```python
from main.entities.song import Song


class CompositionPipeline:
    def __init__(self, stages: list):
        self.stages = stages

    def execute(self, song: Song) -> Song:
        current = song

        for stage in self.stages:
            current = stage.execute(current)

        return current
```

### DLA Rule

Pipeline stages should operate on canonical entities and avoid direct infrastructure calls.

---

# Phase 1 — Foundation

- DLA folder structure
- CLI entrypoint
- Configuration
- Logging
- Testing
- CI
- Example project

Exit criteria:

- `composer` launches successfully.

---

# Phase 2 — Canonical Music Model

Implement:

- Song
- Section
- Track
- Pattern
- Note
- Rest
- Chord
- Scale
- Rhythm
- Tempo
- TimeSignature
- Instrument
- Marker

Rules:

- Backend-independent
- Pure entities
- No Renardo or MIDI knowledge

Exit criteria:

- A complete song can exist entirely in memory.

---

# Phase 3 — AI-Friendly Project Files (MVP)

Project structure:

```text
project/
    project.yaml
    ai_notes.md
    exports/
```

`project.yaml`

- metadata
- tempo
- key
- sections
- tracks
- arrangement
- instruments

`ai_notes.md`

- emotions
- references
- ideas
- TODOs

Exit criteria:

- Editing project files changes the loaded project.

---

# Phase 4 — Interactive Sandbox (MVP)

Capabilities:

- load
- play
- mutate
- transpose
- undo
- save
- export

All operations manipulate canonical entities.

Exit criteria:

- Brainstorm without opening a DAW.

---

# Phase 5 — Renardo Backend (MVP)

Responsibilities:

- Translate canonical entities
- Playback
- Generate Renardo source

Business layer remains unaware of Renardo.

---

# Phase 6 — MIDI Backend (MVP)

Responsibilities:

- Export canonical entities to MIDI
- Tempo
- Velocity
- Timing
- Tracks

Exit criteria:

- Import directly into a DAW.

---

# Phase 7 — Pattern Engine

Operations:

- transpose
- invert
- reverse
- stretch
- quantize
- humanize
- duplicate
- merge
- split
- randomize

---

# Phase 8 — Arrangement Engine

Features:

- intro
- verse
- chorus
- bridge
- outro
- transitions
- motif reuse
- section variation

---

# Phase 9 — External AI Workflow

External AI tools may:

- edit `project.yaml`
- edit `ai_notes.md`
- propose motifs
- propose arrangements
- create sections

The application never calls AI services directly.

---

# Phase 10 — Future Backends

Potential interfaces:

- FL Studio
- Ableton
- REAPER
- MusicXML
- OSC
- Audio rendering
- VST preview
- MIDI devices

---

# MVP Summary

The MVP includes:

- DLA architecture
- Canonical Music Model
- CLI sandbox
- AI-editable project files
- Renardo playback/export
- MIDI export
- Project validation
- Basic pattern mutation
- Undoable sandbox operations

---

# Long-Term Vision

The project is not a DAW.

It is not a Renardo wrapper.

It is a backend-independent composition platform built around a canonical music model. Every exporter, renderer, DAW, notation tool, or AI workflow is simply another interface around the same semantic representation of music.
