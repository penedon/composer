import { BaseDirectory, exists, mkdir, readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs'

import type { ProjectRepository } from '@application/ports/ports'
import { parseProject } from '@domain/project/project.migrations'
import type { CompositionProject, ProjectSummary } from '@domain/project/project.types'

const DIRECTORY = 'projects'
const INDEX = `${DIRECTORY}/index.json`
const RECOVERY = `${DIRECTORY}/recovery.json`
const options = { baseDir: BaseDirectory.AppLocalData }

export class TauriProjectRepository implements ProjectRepository {
  private async ensureDirectory(): Promise<void> {
    if (!await exists(DIRECTORY, options)) await mkdir(DIRECTORY, { ...options, recursive: true })
  }

  private projectPath(id: string): string {
    return `${DIRECTORY}/${id.replace(/[^a-z0-9-]/gi, '-')}.json`
  }

  async list(): Promise<ProjectSummary[]> {
    await this.ensureDirectory()
    if (!await exists(INDEX, options)) return []
    try { return JSON.parse(await readTextFile(INDEX, options)) as ProjectSummary[] } catch { return [] }
  }

  async load(id: string): Promise<CompositionProject | null> {
    const path = this.projectPath(id)
    if (!await exists(path, options)) return null
    return parseProject(JSON.parse(await readTextFile(path, options)))
  }

  async save(project: CompositionProject): Promise<void> {
    await this.ensureDirectory()
    const path = this.projectPath(project.id)
    if (await exists(path, options)) await writeTextFile(RECOVERY, await readTextFile(path, options), options)
    await writeTextFile(path, JSON.stringify(project), options)
    const summaries = (await this.list()).filter((item) => item.id !== project.id)
    summaries.unshift({ id: project.id, title: project.title, updatedAt: project.updatedAt })
    await writeTextFile(INDEX, JSON.stringify(summaries), options)
  }

  async remove(id: string): Promise<void> {
    const path = this.projectPath(id)
    if (await exists(path, options)) await remove(path, options)
    await writeTextFile(INDEX, JSON.stringify((await this.list()).filter((item) => item.id !== id)), options)
  }
}
