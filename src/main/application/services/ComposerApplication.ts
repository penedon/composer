import type { CompositionProject, ProjectSummary } from '@domain/project/project.types'
import { createProject } from '@domain/project/project.factory'
import { songExamples } from '@domain/examples/songExamples'

import type { MidiExporter, PlaybackEngine, PortableProjectGateway, ProjectRepository } from '../ports/ports'
import { ProjectSession } from './ProjectSession'

export class ComposerApplication {
  private session: ProjectSession | null = null

  constructor(
    private readonly repository: ProjectRepository,
    readonly playback: PlaybackEngine,
    readonly midi: MidiExporter,
    readonly portable: PortableProjectGateway,
  ) {}

  get project(): CompositionProject | null {
    return this.session?.project ?? null
  }

  get canUndo(): boolean {
    return this.session?.canUndo ?? false
  }

  get canRedo(): boolean {
    return this.session?.canRedo ?? false
  }

  async listProjects(): Promise<ProjectSummary[]> {
    return this.repository.list()
  }

  async create(title: string): Promise<CompositionProject> {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `song-${Date.now()}`
    const project = createProject(id, title)
    this.session = new ProjectSession(project)
    await this.repository.save(project)
    return project
  }

  async load(id: string): Promise<CompositionProject> {
    const existing = await this.repository.load(id)
    const exampleSeed = songExamples.find((example) => example.project.id === id)?.project
    const project = existing
      ? exampleSeed ? this.upgradeExample(existing, exampleSeed) : existing
      : createProject(id, id === 'the-doorway' ? 'The Doorway' : 'Untitled song')
    this.session = new ProjectSession(project)
    await this.repository.save(project)
    return project
  }

  async importProject(text: string): Promise<CompositionProject> {
    const project = this.portable.importProject(text)
    this.session = new ProjectSession(project)
    await this.repository.save(project)
    return project
  }

  async openExample(seed: CompositionProject): Promise<CompositionProject> {
    const existing = await this.repository.load(seed.id)
    const project = existing ? this.upgradeExample(existing, seed) : structuredClone(seed)
    this.session = new ProjectSession(project)
    if (!existing || project !== existing) await this.repository.save(project)
    return project
  }

  private upgradeExample(existing: CompositionProject, seed: CompositionProject): CompositionProject {
    const arrangementMarker = seed.operations.find((operation) => operation.description.startsWith('Sequenced '))
    if (!arrangementMarker || existing.operations.some((operation) => operation.description === arrangementMarker.description)) return existing

    const occupied = new Set(existing.sequenceClips.map((clip) => `${clip.trackId}:${clip.sectionId}`))
    const missingClips = seed.sequenceClips
      .filter((clip) => !occupied.has(`${clip.trackId}:${clip.sectionId}`))
      .map((clip) => structuredClone(clip))

    return {
      ...existing,
      updatedAt: new Date().toISOString(),
      sequenceClips: [...existing.sequenceClips, ...missingClips],
      operations: [...existing.operations, structuredClone(arrangementMarker)],
    }
  }

  mutate(description: string, transform: (project: CompositionProject) => CompositionProject): CompositionProject {
    if (!this.session) throw new Error('No active project')
    return this.session.execute(description, transform)
  }

  undo(): CompositionProject {
    if (!this.session) throw new Error('No active project')
    return this.session.undo()
  }

  redo(): CompositionProject {
    if (!this.session) throw new Error('No active project')
    return this.session.redo()
  }

  async save(): Promise<void> {
    if (!this.session) throw new Error('No active project')
    await this.repository.save(this.session.project)
  }
}
