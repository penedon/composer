import { createId } from '@domain/shared/createId'

import type { CompositionProject } from '@domain/project/project.types'

interface Snapshot {
  description: string
  project: CompositionProject
}

export class ProjectSession {
  private undoStack: Snapshot[] = []
  private redoStack: Snapshot[] = []

  constructor(private current: CompositionProject) {}

  get project(): CompositionProject {
    return this.current
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  execute(description: string, transform: (project: CompositionProject) => CompositionProject): CompositionProject {
    const next = transform(this.current)
    if (next === this.current) return this.current
    this.undoStack.push({ description, project: structuredClone(this.current) })
    this.redoStack = []
    this.current = {
      ...next,
      operations: [...next.operations, { id: createId('operation'), description, createdAt: new Date().toISOString() }],
    }
    return this.current
  }

  undo(): CompositionProject {
    const previous = this.undoStack.pop()
    if (!previous) return this.current
    this.redoStack.push({ description: previous.description, project: structuredClone(this.current) })
    this.current = previous.project
    return this.current
  }

  redo(): CompositionProject {
    const next = this.redoStack.pop()
    if (!next) return this.current
    this.undoStack.push({ description: next.description, project: structuredClone(this.current) })
    this.current = next.project
    return this.current
  }
}
