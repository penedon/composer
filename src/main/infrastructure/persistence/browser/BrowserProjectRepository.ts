import { parseProject } from '@domain/project/project.migrations'
import type { CompositionProject, ProjectSummary } from '@domain/project/project.types'
import type { ProjectRepository } from '@application/ports/ports'

const INDEX_KEY = 'composer:projects'
const RECOVERY_KEY = 'composer:recovery'

export class BrowserProjectRepository implements ProjectRepository {
  private key(id: string): string {
    return `composer:project:${id}`
  }

  async list(): Promise<ProjectSummary[]> {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as ProjectSummary[]
    } catch {
      return []
    }
  }

  async load(id: string): Promise<CompositionProject | null> {
    const raw = localStorage.getItem(this.key(id))
    if (!raw) return null
    return parseProject(JSON.parse(raw))
  }

  async save(project: CompositionProject): Promise<void> {
    const current = localStorage.getItem(this.key(project.id))
    if (current) localStorage.setItem(RECOVERY_KEY, current)
    localStorage.setItem(this.key(project.id), JSON.stringify(project))
    const summaries = (await this.list()).filter((item) => item.id !== project.id)
    summaries.unshift({ id: project.id, title: project.title, updatedAt: project.updatedAt })
    localStorage.setItem(INDEX_KEY, JSON.stringify(summaries))
  }

  loadRecovery(): CompositionProject | null {
    const raw = localStorage.getItem(RECOVERY_KEY)
    return raw ? parseProject(JSON.parse(raw)) : null
  }

  async remove(id: string): Promise<void> {
    localStorage.removeItem(this.key(id))
    localStorage.setItem(INDEX_KEY, JSON.stringify((await this.list()).filter((item) => item.id !== id)))
  }
}
