import { createId } from '@domain/shared/createId'
import type { StructureTemplate } from '@domain/structure/structureTemplates'

import { findDirectSequenceClip, resolveSequenceClip } from './project.sequence'
import type { ArrangementTrack, ChordEvent, CompositionProject, EmotionFamily, FeaturedEmotion, MidiNoteEvent, Phrase, SequenceClip, SongSection } from './project.types'

function changed(project: CompositionProject): CompositionProject {
  return { ...project, updatedAt: new Date().toISOString() }
}

function projectIndex(index: number, sourceLength: number, targetLength: number): number {
  if (sourceLength <= 1 || targetLength <= 1) return 0
  return Math.round((index * (targetLength - 1)) / (sourceLength - 1))
}

export function updateStoryBlock(project: CompositionProject, blockId: string, text: string): CompositionProject {
  return changed({ ...project, story: project.story.map((block) => (block.id === blockId ? { ...block, text } : block)) })
}

export function updateStoryLabel(project: CompositionProject, blockId: string, label: string | null): CompositionProject {
  return changed({ ...project, story: project.story.map((block) => (block.id === blockId ? { ...block, label } : block)) })
}

export function addStoryBlock(project: CompositionProject): CompositionProject {
  return changed({ ...project, story: [...project.story, { id: createId('story'), label: null, text: '' }] })
}

export function updateFrame(project: CompositionProject, patch: Partial<CompositionProject['frame']>): CompositionProject {
  return changed({ ...project, frame: { ...project.frame, ...patch } })
}

export function updateEmotionPoint(project: CompositionProject, sectionId: string, emotionId: string, intensity: number): CompositionProject {
  const bounded = Math.max(0, Math.min(100, Math.round(intensity)))
  const points = project.emotionPlan.points.map((point) =>
    point.sectionId === sectionId && point.emotionId === emotionId ? { ...point, intensity: bounded } : point,
  )
  return changed({ ...project, emotionPlan: { ...project.emotionPlan, points } })
}

export function setDominantEmotionFamily(project: CompositionProject, dominantFamily: EmotionFamily): CompositionProject {
  return changed({ ...project, emotionPlan: { ...project.emotionPlan, dominantFamily } })
}

export function replaceFeaturedEmotion(project: CompositionProject, index: number, emotion: FeaturedEmotion): CompositionProject {
  const previous = project.emotionPlan.featured[index]
  if (!previous || project.emotionPlan.featured.some((item, itemIndex) => itemIndex !== index && item.id === emotion.id)) return project
  const featured = project.emotionPlan.featured.map((item, itemIndex) => (itemIndex === index ? emotion : item))
  const points = project.emotionPlan.points.map((point) => point.emotionId === previous.id ? { ...point, emotionId: emotion.id } : point)
  const phrases = project.phrases.map((phrase) => phrase.emotionId === previous.id ? { ...phrase, emotionId: emotion.id } : phrase)
  return changed({ ...project, phrases, emotionPlan: { ...project.emotionPlan, featured, points } })
}

export function addSection(project: CompositionProject, name = 'New section'): CompositionProject {
  const section: SongSection = { id: createId('section'), name, bars: 4, color: '#514b43', narrativePurpose: '', sourceSectionId: null }
  return changed({ ...project, sections: [...project.sections, section] })
}

export function applyStructureTemplate(project: CompositionProject, template: StructureTemplate): CompositionProject {
  const sectionIds = new Map(template.sections.map((section) => [section.key, createId('section')]))
  const sections: SongSection[] = template.sections.map((section) => ({
    id: sectionIds.get(section.key)!,
    name: section.name,
    bars: section.bars,
    color: section.color,
    narrativePurpose: section.narrativePurpose,
    sourceSectionId: section.sourceKey ? sectionIds.get(section.sourceKey) ?? null : null,
  }))
  const previousSectionIndex = new Map(project.sections.map((section, index) => [section.id, index]))
  const phraseOrder = new Map<string, number>()
  const phrases = project.phrases.map((phrase) => {
    const oldIndex = previousSectionIndex.get(phrase.sectionId) ?? 0
    const newSection = sections[projectIndex(oldIndex, project.sections.length, sections.length)] ?? sections[0]!
    const order = phraseOrder.get(newSection.id) ?? 0
    phraseOrder.set(newSection.id, order + 1)
    return { ...phrase, sectionId: newSection.id, order }
  })
  const pointIntensities = new Map(project.emotionPlan.points.map((point) => [`${point.sectionId}:${point.emotionId}`, point.intensity]))
  const points = sections.flatMap((section, index) => {
    const previousSection = project.sections[projectIndex(index, sections.length, project.sections.length)]
    return project.emotionPlan.featured.map((emotion) => ({
      sectionId: section.id,
      emotionId: emotion.id,
      intensity: previousSection ? pointIntensities.get(`${previousSection.id}:${emotion.id}`) ?? 0 : 0,
    }))
  })

  const sequenceClipsByTarget = new Map<string, SequenceClip>()
  for (const clip of project.sequenceClips) {
    const oldIndex = previousSectionIndex.get(clip.sectionId) ?? 0
    const newSection = sections[projectIndex(oldIndex, project.sections.length, sections.length)] ?? sections[0]
    if (!newSection) continue
    const key = `${clip.trackId}:${newSection.id}`
    const existing = sequenceClipsByTarget.get(key)
    if (existing) {
      existing.notes.push(...clip.notes.map((note) => boundedNote({ ...note, id: createId('note') }, newSection.bars * 4)))
    } else {
      sequenceClipsByTarget.set(key, { ...clip, sectionId: newSection.id, sourceClipId: null, notes: clip.notes.map((note) => boundedNote({ ...note }, newSection.bars * 4)) })
    }
  }

  return changed({ ...project, sections, phrases, sequenceClips: [...sequenceClipsByTarget.values()], emotionPlan: { ...project.emotionPlan, points } })
}

export function moveSection(project: CompositionProject, sectionId: string, direction: -1 | 1): CompositionProject {
  const index = project.sections.findIndex((section) => section.id === sectionId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= project.sections.length) return project
  const sections = [...project.sections]
  const current = sections[index]
  const destination = sections[target]
  if (!current || !destination) return project
  sections[index] = destination
  sections[target] = current
  return changed({ ...project, sections })
}

export function createSectionVariation(project: CompositionProject, sourceId: string): CompositionProject {
  const source = project.sections.find((section) => section.id === sourceId)
  if (!source) return project
  const section: SongSection = { ...source, id: createId('section'), name: `${source.name} variation`, sourceSectionId: source.id }
  return changed({ ...project, sections: [...project.sections, section] })
}

export function updateSection(project: CompositionProject, sectionId: string, patch: Partial<SongSection>): CompositionProject {
  return changed({ ...project, sections: project.sections.map((section) => section.id === sectionId ? { ...section, ...patch, id: section.id } : section) })
}

export function removeSection(project: CompositionProject, sectionId: string): CompositionProject {
  if (project.sections.length <= 1) return project
  const sections = project.sections.filter((section) => section.id !== sectionId)
  return changed({
    ...project,
    sections: sections.map((section) => section.sourceSectionId === sectionId ? { ...section, sourceSectionId: null } : section),
    phrases: project.phrases.filter((phrase) => phrase.sectionId !== sectionId),
    sequenceClips: project.sequenceClips.filter((clip) => clip.sectionId !== sectionId),
    emotionPlan: { ...project.emotionPlan, points: project.emotionPlan.points.filter((point) => point.sectionId !== sectionId) },
  })
}

export function addPhrase(project: CompositionProject, sectionId: string, instrumental = false): CompositionProject {
  const order = project.phrases.filter((phrase) => phrase.sectionId === sectionId).length
  const phrase: Phrase = {
    id: createId('phrase'), sectionId, order, bars: 2, lyrics: '', chords: [], emotionId: project.emotionPlan.featured[0]?.id ?? null,
    rhythm: project.frame.groove, dynamics: 'Even', instrumental,
  }
  return changed({ ...project, phrases: [...project.phrases, phrase] })
}

export function updatePhrase(project: CompositionProject, phraseId: string, patch: Partial<Phrase>): CompositionProject {
  return changed({ ...project, phrases: project.phrases.map((phrase) => (phrase.id === phraseId ? { ...phrase, ...patch, id: phrase.id } : phrase)) })
}

export function movePhrase(project: CompositionProject, phraseId: string, direction: -1 | 1): CompositionProject {
  const phrase = project.phrases.find((item) => item.id === phraseId)
  if (!phrase) return project
  const ordered = project.phrases.filter((item) => item.sectionId === phrase.sectionId).sort((a, b) => a.order - b.order)
  const index = ordered.findIndex((item) => item.id === phraseId)
  const target = ordered[index + direction]
  if (!target) return project
  return changed({
    ...project,
    phrases: project.phrases.map((item) => item.id === phrase.id ? { ...item, order: target.order } : item.id === target.id ? { ...item, order: phrase.order } : item),
  })
}

export function removePhrase(project: CompositionProject, phraseId: string): CompositionProject {
  const phrase = project.phrases.find((item) => item.id === phraseId)
  if (!phrase) return project
  const phrases = project.phrases.filter((item) => item.id !== phraseId).map((item) =>
    item.sectionId === phrase.sectionId && item.order > phrase.order ? { ...item, order: item.order - 1 } : item,
  )
  return changed({ ...project, phrases, alternatives: project.alternatives.filter((item) => item.targetId !== phraseId) })
}

export function splitPhrase(project: CompositionProject, phraseId: string): CompositionProject {
  const phrase = project.phrases.find((item) => item.id === phraseId)
  if (!phrase) return project
  const words = phrase.lyrics.trim().split(/\s+/).filter(Boolean)
  const splitAt = Math.ceil(words.length / 2)
  const halfBeats = phrase.bars * 2
  const first: Phrase = { ...phrase, bars: Math.max(1, Math.ceil(phrase.bars / 2)), lyrics: words.slice(0, splitAt).join(' '), chords: phrase.chords.filter((chord) => chord.beat < halfBeats) }
  const second: Phrase = {
    ...phrase,
    id: createId('phrase'),
    order: phrase.order + 1,
    bars: Math.max(1, Math.floor(phrase.bars / 2)),
    lyrics: words.slice(splitAt).join(' '),
    chords: phrase.chords.filter((chord) => chord.beat >= halfBeats).map((chord) => ({ ...chord, id: createId('chord'), beat: chord.beat - halfBeats })),
  }
  const phrases = project.phrases.map((item) => item.id === phrase.id ? first : item.sectionId === phrase.sectionId && item.order > phrase.order ? { ...item, order: item.order + 1 } : item)
  return changed({ ...project, phrases: [...phrases, second] })
}

export function mergePhraseWithNext(project: CompositionProject, phraseId: string): CompositionProject {
  const phrase = project.phrases.find((item) => item.id === phraseId)
  const next = phrase && project.phrases.find((item) => item.sectionId === phrase.sectionId && item.order === phrase.order + 1)
  if (!phrase || !next) return project
  const offset = phrase.bars * 4
  const merged: Phrase = { ...phrase, bars: phrase.bars + next.bars, lyrics: [phrase.lyrics, next.lyrics].filter(Boolean).join(' '), chords: [...phrase.chords, ...next.chords.map((chord) => ({ ...chord, beat: chord.beat + offset }))] }
  const phrases = project.phrases.filter((item) => item.id !== next.id).map((item) => item.id === phrase.id ? merged : item.sectionId === phrase.sectionId && item.order > next.order ? { ...item, order: item.order - 1 } : item)
  return changed({ ...project, phrases, alternatives: project.alternatives.filter((item) => item.targetId !== next.id) })
}

export function addChord(project: CompositionProject, phraseId: string, symbol: string): CompositionProject {
  const phrase = project.phrases.find((candidate) => candidate.id === phraseId)
  if (!phrase) return project
  const totalBeats = phrase.bars * 4
  const chord: ChordEvent = { id: createId('chord'), symbol, beat: Math.min(totalBeats - 1, phrase.chords.length * 2), duration: 2 }
  return updatePhrase(project, phraseId, { chords: [...phrase.chords, chord] })
}

export function createPhraseAlternative(project: CompositionProject, phraseId: string): CompositionProject {
  const phrase = project.phrases.find((candidate) => candidate.id === phraseId)
  if (!phrase) return project
  return changed({
    ...project,
    alternatives: [...project.alternatives, { id: createId('alternative'), targetId: phraseId, name: `Alternative ${project.alternatives.length + 1}`, phrase: structuredClone(phrase) }],
  })
}

export function restorePhraseAlternative(project: CompositionProject, alternativeId: string): CompositionProject {
  const alternative = project.alternatives.find((item) => item.id === alternativeId)
  if (!alternative) return project
  return changed({ ...project, phrases: project.phrases.map((phrase) => phrase.id === alternative.targetId ? { ...structuredClone(alternative.phrase), id: alternative.targetId } : phrase) })
}

export function toggleTrack(project: CompositionProject, trackId: string, property: 'muted' | 'solo'): CompositionProject {
  return changed({ ...project, tracks: project.tracks.map((track) => (track.id === trackId ? { ...track, [property]: !track[property] } : track)) })
}

export function updateTrack(project: CompositionProject, trackId: string, patch: Partial<ArrangementTrack>): CompositionProject {
  return changed({
    ...project,
    tracks: project.tracks.map((track) => (track.id === trackId ? { ...track, ...patch, id: track.id } : track)),
  })
}

function boundedNote(note: MidiNoteEvent, sectionBeats: number): MidiNoteEvent {
  const startBeat = Math.max(0, Math.min(sectionBeats - .0625, note.startBeat))
  return {
    ...note,
    pitch: Math.max(0, Math.min(127, Math.round(note.pitch))),
    startBeat,
    durationBeats: Math.max(.0625, Math.min(sectionBeats - startBeat, note.durationBeats)),
    velocity: Math.max(1, Math.min(127, Math.round(note.velocity))),
  }
}

export function addSequenceNote(
  project: CompositionProject,
  trackId: string,
  sectionId: string,
  note: Omit<MidiNoteEvent, 'id'>,
): CompositionProject {
  const section = project.sections.find((candidate) => candidate.id === sectionId)
  if (!section || !project.tracks.some((track) => track.id === trackId)) return project
  if (!findDirectSequenceClip(project, trackId, sectionId) && resolveSequenceClip(project, trackId, sectionId)?.linked) return project

  const nextNote = boundedNote({ ...note, id: createId('note') }, section.bars * 4)
  const direct = findDirectSequenceClip(project, trackId, sectionId)
  const sequenceClips = direct
    ? project.sequenceClips.map((clip) => clip.id === direct.id ? { ...clip, notes: [...clip.notes, nextNote] } : clip)
    : [...project.sequenceClips, { id: createId('clip'), trackId, sectionId, sourceClipId: null, notes: [nextNote] }]
  return changed({ ...project, sequenceClips })
}

export function updateSequenceNote(project: CompositionProject, clipId: string, noteId: string, patch: Partial<MidiNoteEvent>): CompositionProject {
  const clip = project.sequenceClips.find((candidate) => candidate.id === clipId)
  const section = clip && project.sections.find((candidate) => candidate.id === clip.sectionId)
  if (!clip || !section) return project
  return changed({
    ...project,
    sequenceClips: project.sequenceClips.map((candidate) => candidate.id === clipId
      ? { ...candidate, notes: candidate.notes.map((note) => note.id === noteId ? boundedNote({ ...note, ...patch, id: note.id }, section.bars * 4) : note) }
      : candidate),
  })
}

export function removeSequenceNote(project: CompositionProject, clipId: string, noteId: string): CompositionProject {
  const clip = project.sequenceClips.find((candidate) => candidate.id === clipId)
  if (!clip) return project
  return changed({
    ...project,
    sequenceClips: project.sequenceClips.map((candidate) => candidate.id === clipId
      ? { ...candidate, notes: candidate.notes.filter((note) => note.id !== noteId) }
      : candidate),
  })
}

export function makeSequenceVariation(project: CompositionProject, trackId: string, sectionId: string): CompositionProject {
  if (findDirectSequenceClip(project, trackId, sectionId)) return project
  const resolved = resolveSequenceClip(project, trackId, sectionId)
  if (!resolved?.linked) return project
  const variation: SequenceClip = {
    id: createId('clip'),
    trackId,
    sectionId,
    sourceClipId: resolved.clip.id,
    notes: resolved.clip.notes.map((note) => ({ ...note, id: createId('note') })),
  }
  return changed({ ...project, sequenceClips: [...project.sequenceClips, variation] })
}
