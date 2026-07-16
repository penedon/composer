import { beforeEach, describe, expect, it } from 'vitest'

import { createProject } from '@domain/project/project.factory'
import { BrowserProjectRepository } from '@infrastructure/persistence/browser/BrowserProjectRepository'

describe('BrowserProjectRepository', () => {
  beforeEach(() => localStorage.clear())

  it('saves, lists, reloads, and removes projects', async () => {
    const repository = new BrowserProjectRepository()
    const project = createProject('local', 'Local')
    await repository.save(project)
    expect(await repository.list()).toEqual([{ id: 'local', title: 'Local', updatedAt: project.updatedAt }])
    expect(await repository.load('local')).toEqual(project)
    await repository.remove('local')
    expect(await repository.load('local')).toBeNull()
  })

  it('keeps the previous version as a recovery snapshot', async () => {
    const repository = new BrowserProjectRepository()
    const first = createProject('recover', 'First')
    await repository.save(first)
    await repository.save({ ...first, title: 'Second' })
    expect(repository.loadRecovery()?.title).toBe('First')
  })
})
