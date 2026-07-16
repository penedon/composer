import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { composerApplication } from '@main/application'
import type { CompositionProject, Phrase, ProjectSummary } from '@domain/project/project.types'
import type { PhrasePlaybackRequest } from '@application/ports/ports'

export const useProjectStore = defineStore('project', () => {
  const project = shallowRef<CompositionProject | null>(null)
  const projects = ref<ProjectSummary[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const lastSavedAt = ref<string | null>(null)
  const error = ref<string | null>(null)
  const playingPhraseId = ref<string | null>(null)
  const playingSong = ref(false)
  const playbackError = ref<string | null>(null)
  const selectedPhraseId = ref<string | null>(null)
  const selectedSectionId = ref<string>('verse-1')
  const revision = ref(0)
  let playbackTimer: ReturnType<typeof setTimeout> | null = null

  const canUndo = computed(() => revision.value >= 0 && composerApplication.canUndo)
  const canRedo = computed(() => revision.value >= 0 && composerApplication.canRedo)

  async function refreshLibrary(): Promise<void> {
    projects.value = await composerApplication.listProjects()
  }

  async function load(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      project.value = await composerApplication.load(id)
      selectedSectionId.value = project.value.sections[1]?.id ?? project.value.sections[0]?.id ?? ''
      selectedPhraseId.value = project.value.phrases.find((phrase) => phrase.sectionId === selectedSectionId.value)?.id ?? null
      await refreshLibrary()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Unable to load project'
    } finally {
      loading.value = false
    }
  }

  async function create(title: string): Promise<CompositionProject> {
    project.value = await composerApplication.create(title)
    await refreshLibrary()
    return project.value
  }

  async function importProject(text: string): Promise<CompositionProject> {
    project.value = await composerApplication.importProject(text)
    await refreshLibrary()
    return project.value
  }

  async function openExample(seed: CompositionProject): Promise<CompositionProject> {
    project.value = await composerApplication.openExample(seed)
    selectedSectionId.value = project.value.sections[0]?.id ?? ''
    selectedPhraseId.value = project.value.phrases.find((phrase) => phrase.sectionId === selectedSectionId.value)?.id ?? null
    await refreshLibrary()
    return project.value
  }

  async function selectNativeProject(): Promise<CompositionProject | null> {
    const selected = await composerApplication.portable.selectProject?.() ?? null
    if (!selected) return null
    project.value = await composerApplication.importProject(JSON.stringify(selected))
    await refreshLibrary()
    return project.value
  }

  function mutate(description: string, transform: (value: CompositionProject) => CompositionProject): void {
    project.value = composerApplication.mutate(description, transform)
    revision.value += 1
    void save()
  }

  function undo(): void {
    project.value = composerApplication.undo()
    revision.value += 1
    void save()
  }

  function redo(): void {
    project.value = composerApplication.redo()
    revision.value += 1
    void save()
  }

  async function save(): Promise<void> {
    saving.value = true
    try {
      await composerApplication.save()
      lastSavedAt.value = new Date().toISOString()
      await refreshLibrary()
    } finally {
      saving.value = false
    }
  }

  async function playPhrase(phrase: Phrase, leadIn = false, loop = false): Promise<void> {
    if (!project.value) return
    clearPlaybackTimer()
    playingSong.value = false
    playbackError.value = null
    const ordered = project.value.phrases
      .filter((item) => item.sectionId === phrase.sectionId)
      .sort((a, b) => a.order - b.order)
    const index = ordered.findIndex((item) => item.id === phrase.id)
    const previous = index > 0 ? ordered[index - 1] : undefined
    const request: PhrasePlaybackRequest = {
      phrase,
      tempo: project.value.frame.tempo,
      key: project.value.frame.key,
      meter: project.value.frame.meter,
      leadInChord: leadIn ? previous?.chords.at(-1)?.symbol ?? null : null,
      loop,
    }
    playingPhraseId.value = phrase.id
    await composerApplication.playback.playPhrase(request)
    if (!loop) {
      playbackTimer = setTimeout(() => { playingPhraseId.value = null }, phrase.bars * 4 * (60 / project.value!.frame.tempo) * 1000)
    }
  }

  function clearPlaybackTimer(): void {
    if (playbackTimer) clearTimeout(playbackTimer)
    playbackTimer = null
  }

  async function playSong(): Promise<void> {
    if (!project.value) return
    clearPlaybackTimer()
    playingPhraseId.value = null
    playbackError.value = null
    playingSong.value = true
    try {
      const duration = await composerApplication.playback.playSong(project.value)
      if (duration <= 0) {
        playingSong.value = false
        playbackError.value = project.value.phrases.length ? 'Audio playback is unavailable in this environment.' : 'Add a phrase before playing the song.'
        return
      }
      playbackTimer = setTimeout(() => { playingSong.value = false }, duration * 1000)
    } catch (cause) {
      playingSong.value = false
      playbackError.value = cause instanceof Error ? cause.message : 'Unable to start playback.'
    }
  }

  async function stop(): Promise<void> {
    clearPlaybackTimer()
    await composerApplication.playback.stop()
    playingPhraseId.value = null
    playingSong.value = false
  }

  async function auditionChord(symbol: string): Promise<void> {
    await composerApplication.playback.auditionChord(symbol)
  }

  function downloadProject(): void {
    if (!project.value) return
    composerApplication.portable.download(composerApplication.portable.exportProject(project.value))
  }

  function downloadMidi(): void {
    if (!project.value) return
    composerApplication.portable.download(composerApplication.midi.export(project.value))
  }

  return {
    project, projects, loading, saving, lastSavedAt, error, playingPhraseId, playingSong, playbackError, selectedPhraseId, selectedSectionId,
    canUndo, canRedo, refreshLibrary, load, create, importProject, openExample, selectNativeProject, mutate, undo, redo, save, playPhrase, stop,
    playSong, downloadProject, downloadMidi, auditionChord,
  }
})
