import type { CompositionProject, SequenceClip } from './project.types'

export interface ResolvedSequenceClip {
  clip: SequenceClip
  linked: boolean
  sourceSectionId: string | null
}

export function findDirectSequenceClip(project: CompositionProject, trackId: string, sectionId: string): SequenceClip | null {
  return project.sequenceClips.find((clip) => clip.trackId === trackId && clip.sectionId === sectionId) ?? null
}

export function resolveSequenceClip(project: CompositionProject, trackId: string, sectionId: string): ResolvedSequenceClip | null {
  const direct = findDirectSequenceClip(project, trackId, sectionId)
  if (direct) return { clip: direct, linked: false, sourceSectionId: null }

  const visited = new Set<string>()
  let section = project.sections.find((candidate) => candidate.id === sectionId)
  while (section?.sourceSectionId && !visited.has(section.id)) {
    visited.add(section.id)
    const sourceSectionId = section.sourceSectionId
    const inherited = findDirectSequenceClip(project, trackId, sourceSectionId)
    if (inherited) return { clip: inherited, linked: true, sourceSectionId }
    section = project.sections.find((candidate) => candidate.id === sourceSectionId)
  }
  return null
}
