import type { CompositionProject, SongSection } from '@domain/project/project.types'
import type { SongPreviewSection } from '@domain/playback/songPreview'

export interface SongPosition {
  section: SongSection
  sectionBar: number
  progress: number
}

export interface SongPhrasePlayback {
  phraseId: string
  sectionId: string
  beat: number
}

export function projectSongPosition(
  project: CompositionProject,
  previewSections: SongPreviewSection[],
  beat: number,
): SongPosition | null {
  if (!previewSections.length) return null

  const safeBeat = Math.max(0, beat)
  const range = previewSections.find((section) => safeBeat < section.endBeat) ?? previewSections.at(-1)
  if (!range) return null

  const section = project.sections.find((candidate) => candidate.id === range.sectionId)
  if (!section) return null

  const localBeat = Math.max(0, Math.min(safeBeat - range.startBeat, range.endBeat - range.startBeat))
  const totalBeats = previewSections.at(-1)?.endBeat ?? 0

  return {
    section,
    sectionBar: Math.min(section.bars, Math.floor(localBeat / 4) + 1),
    progress: totalBeats > 0 ? Math.min(1, safeBeat / totalBeats) : 0,
  }
}

export function projectSongSeekBeat(
  project: CompositionProject,
  previewSections: SongPreviewSection[],
  sectionId: string,
  sectionProgress: number,
): number | null {
  const section = project.sections.find((candidate) => candidate.id === sectionId)
  const range = previewSections.find((candidate) => candidate.sectionId === sectionId)
  if (!section || !range) return null

  const localPlannedBeat = Math.max(0, Math.min(1, sectionProgress)) * section.bars * 4
  return range.startBeat + localPlannedBeat
}

export function projectSongPhrasePlayback(project: CompositionProject, beat: number): SongPhrasePlayback | null {
  if (beat < 0) return null
  let sectionStartBeat = 0

  for (const section of project.sections) {
    let phraseStartBeat = sectionStartBeat
    const sectionEndBeat = sectionStartBeat + section.bars * 4
    const phrases = project.phrases
      .filter((phrase) => phrase.sectionId === section.id)
      .sort((left, right) => left.order - right.order)

    for (const phrase of phrases) {
      const phraseEndBeat = Math.min(sectionEndBeat, phraseStartBeat + phrase.bars * 4)
      if (beat >= phraseStartBeat && beat < phraseEndBeat) {
        return { phraseId: phrase.id, sectionId: section.id, beat: beat - phraseStartBeat }
      }
      phraseStartBeat = phraseEndBeat
    }
    sectionStartBeat = sectionEndBeat
  }

  return null
}
