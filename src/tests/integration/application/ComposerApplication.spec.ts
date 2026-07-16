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
})
