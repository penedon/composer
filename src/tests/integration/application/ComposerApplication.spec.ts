import { describe, expect, it } from 'vitest'

import { ComposerApplication } from '@application/services/ComposerApplication'
import type { PhrasePlaybackRequest, PlaybackEngine, ProjectRepository } from '@application/ports/ports'
import type { CompositionProject, ProjectSummary } from '@domain/project/project.types'
import { updateFrame } from '@domain/project/project.operations'
import { createLongRoadWithinProject } from '@domain/examples/longRoadWithin.example'
import { MidiFileExporter } from '@infrastructure/export/midi/MidiFileExporter'
import { BrowserPortableProjectGateway } from '@infrastructure/platform/BrowserPortableProjectGateway'

class MemoryRepository implements ProjectRepository {
  projects = new Map<string, CompositionProject>()
  async list(): Promise<ProjectSummary[]> { return [...this.projects.values()].map(({ id, title, updatedAt }) => ({ id, title, updatedAt })) }
  async load(id: string): Promise<CompositionProject | null> { return this.projects.get(id) ?? null }
  async save(project: CompositionProject): Promise<void> { this.projects.set(project.id, structuredClone(project)) }
  async remove(id: string): Promise<void> { this.projects.delete(id) }
}

class FakePlayback implements PlaybackEngine {
  requests: PhrasePlaybackRequest[] = []
  auditioned: string[] = []
  async playPhrase(request: PhrasePlaybackRequest): Promise<void> { this.requests.push(request) }
  async playSong(): Promise<number> { return 10 }
  async auditionChord(symbol: string): Promise<void> { this.auditioned.push(symbol) }
  async auditionNote(): Promise<void> {}
  setTrackVolume(): void {}
  async stop(): Promise<void> {}
}

describe('ComposerApplication', () => {
  it('creates, mutates, saves, and reopens a local project', async () => {
    const repository = new MemoryRepository()
    const app = new ComposerApplication(repository, new FakePlayback(), new MidiFileExporter(), new BrowserPortableProjectGateway())
    const created = await app.create('My First Song')
    app.mutate('Set tempo', (project) => updateFrame(project, { tempo: 111 }))
    await app.save()

    const reopened = await app.load(created.id)
    expect(reopened.frame.tempo).toBe(111)
    expect(await app.listProjects()).toHaveLength(1)
  })

  it('imports and exports canonical JSON', async () => {
    const gateway = new BrowserPortableProjectGateway()
    const app = new ComposerApplication(new MemoryRepository(), new FakePlayback(), new MidiFileExporter(), gateway)
    const created = await app.create('Portable')
    const file = gateway.exportProject(created)
    const imported = await app.importProject(new TextDecoder().decode(file.bytes))
    expect(imported).toEqual(created)
  })

  it('seeds an example once and preserves the artist’s later edits', async () => {
    const repository = new MemoryRepository()
    const app = new ComposerApplication(repository, new FakePlayback(), new MidiFileExporter(), new BrowserPortableProjectGateway())
    const seed = createLongRoadWithinProject()
    await app.openExample(seed)
    app.mutate('Personalize example', (project) => updateFrame(project, { tempo: 97 }))
    await app.save()

    const reopened = await app.openExample(seed)
    expect(reopened.frame.tempo).toBe(97)
    expect(reopened.title).toBe('The Long Road Within')
  })

  it('backfills missing example sequences without replacing existing edits', async () => {
    const repository = new MemoryRepository()
    const seed = createLongRoadWithinProject()
    const legacyCopy = {
      ...structuredClone(seed),
      frame: { ...seed.frame, tempo: 97 },
      sequenceClips: [structuredClone(seed.sequenceClips[0]!)],
      operations: seed.operations.filter((operation) => !operation.description.startsWith('Sequenced ')),
    }
    legacyCopy.sequenceClips[0]!.notes[0]!.velocity = 41
    await repository.save(legacyCopy)

    const app = new ComposerApplication(repository, new FakePlayback(), new MidiFileExporter(), new BrowserPortableProjectGateway())
    const upgraded = await app.openExample(seed)

    expect(upgraded.frame.tempo).toBe(97)
    expect(upgraded.sequenceClips).toHaveLength(seed.sequenceClips.length)
    expect(upgraded.sequenceClips[0]?.notes[0]?.velocity).toBe(41)
    expect(upgraded.operations.at(-1)?.description).toContain('Sequenced guitar, bass, drums, and melody')
    expect(repository.projects.get(seed.id)?.sequenceClips).toHaveLength(seed.sequenceClips.length)
  })

  it('also upgrades an old example when it is reopened from recent projects', async () => {
    const repository = new MemoryRepository()
    const seed = createLongRoadWithinProject()
    await repository.save({
      ...structuredClone(seed),
      sequenceClips: [],
      operations: seed.operations.filter((operation) => !operation.description.startsWith('Sequenced ')),
    })
    const app = new ComposerApplication(repository, new FakePlayback(), new MidiFileExporter(), new BrowserPortableProjectGateway())

    const upgraded = await app.load(seed.id)
    expect(upgraded.sequenceClips).toHaveLength(seed.sequenceClips.length)
  })

  it('does not restore sequences after the arrangement upgrade has been recorded', async () => {
    const repository = new MemoryRepository()
    const seed = createLongRoadWithinProject()
    await repository.save({ ...structuredClone(seed), sequenceClips: [] })
    const app = new ComposerApplication(repository, new FakePlayback(), new MidiFileExporter(), new BrowserPortableProjectGateway())

    const reopened = await app.openExample(seed)
    expect(reopened.sequenceClips).toEqual([])
  })

  it('backfills inferred chords into an existing development reference', async () => {
    const repository = new MemoryRepository()
    const seed = {
      ...createLongRoadWithinProject(),
      id: 'dev-reference-chord-upgrade',
      operations: [
        ...createLongRoadWithinProject().operations,
        { id: 'operation-chords', description: 'Inferred phrase chords from the local licensed MIDI arrangement', createdAt: '2026-07-16T12:00:00.000Z' },
      ],
    }
    await repository.save({
      ...structuredClone(seed),
      frame: { ...seed.frame, tempo: 97 },
      phrases: seed.phrases.map((phrase) => ({ ...structuredClone(phrase), chords: [] })),
      operations: structuredClone(seed.operations),
    })
    const app = new ComposerApplication(repository, new FakePlayback(), new MidiFileExporter(), new BrowserPortableProjectGateway())

    const upgraded = await app.openExample(seed)

    expect(upgraded.frame.tempo).toBe(97)
    expect(upgraded.phrases.every((phrase) => phrase.chords.length > 0)).toBe(true)
    expect(upgraded.operations.filter((operation) => operation.description.startsWith('Inferred phrase chords '))).toHaveLength(1)
  })
})
