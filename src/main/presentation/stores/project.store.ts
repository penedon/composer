import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { composerApplication } from '@main/application'
import { buildSongPreview } from '@domain/playback/songPreview'
import { resolveSequenceClip } from '@domain/project/project.sequence'
import type { CompositionProject, Phrase, ProjectSummary, TrackRole } from '@domain/project/project.types'
import type { PhrasePlaybackRequest } from '@application/ports/ports'

export const useProjectStore = defineStore('project', () => {
  const project = shallowRef<CompositionProject | null>(null)
  const projects = ref<ProjectSummary[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const lastSavedAt = ref<string | null>(null)
  const error = ref<string | null>(null)
  const playingPhraseId = ref<string | null>(null)
  const phrasePlaybackPositionBeats = ref(0)
  const playingSong = ref(false)
  const playingSectionId = ref<string | null>(null)
  const sectionPlaybackPositionBeats = ref(0)
  const songPlaybackPositionSeconds = ref(0)
  const songPlaybackDurationSeconds = ref(0)
  const playbackError = ref<string | null>(null)
  const selectedPhraseId = ref<string | null>(null)
  const selectedSectionId = ref<string>('verse-1')
  const selectedSequenceTrackId = ref<string | null>(null)
  const selectedSequenceNoteId = ref<string | null>(null)
  const revision = ref(0)
  let playbackTimer: ReturnType<typeof setTimeout> | null = null
  let playbackPositionTimer: ReturnType<typeof setInterval> | null = null

  const canUndo = computed(() => revision.value >= 0 && composerApplication.canUndo)
  const canRedo = computed(() => revision.value >= 0 && composerApplication.canRedo)

  async function refreshLibrary(): Promise<void> {
    projects.value = await composerApplication.listProjects()
  }

  async function load(id: string): Promise<void> {
    resetSongPlayback()
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
    resetSongPlayback()
    project.value = await composerApplication.create(title)
    await refreshLibrary()
    return project.value
  }

  async function importProject(text: string): Promise<CompositionProject> {
    resetSongPlayback()
    project.value = await composerApplication.importProject(text)
    await refreshLibrary()
    return project.value
  }

  async function openExample(seed: CompositionProject): Promise<CompositionProject> {
    resetSongPlayback()
    project.value = await composerApplication.openExample(seed)
    selectedSectionId.value = project.value.sections[0]?.id ?? ''
    selectedPhraseId.value = project.value.phrases.find((phrase) => phrase.sectionId === selectedSectionId.value)?.id ?? null
    await refreshLibrary()
    return project.value
  }

  async function selectNativeProject(): Promise<CompositionProject | null> {
    const selected = await composerApplication.portable.selectProject?.() ?? null
    if (!selected) return null
    resetSongPlayback()
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
    resetSongPlayback()
    playingSong.value = false
    phrasePlaybackPositionBeats.value = 0
    playbackError.value = null
    const ordered = project.value.phrases
      .filter((item) => item.sectionId === phrase.sectionId)
      .sort((a, b) => a.order - b.order)
    const index = ordered.findIndex((item) => item.id === phrase.id)
    const previous = index > 0 ? ordered[index - 1] : undefined
    const harmonyInstrumentId = project.value.tracks.find((track) => track.role === 'harmony')?.instrumentId
    const request: PhrasePlaybackRequest = {
      phrase,
      tempo: project.value.frame.tempo,
      key: project.value.frame.key,
      meter: project.value.frame.meter,
      leadInChord: leadIn ? previous?.chords.at(-1)?.symbol ?? null : null,
      loop,
      ...(harmonyInstrumentId ? { instrumentId: harmonyInstrumentId } : {}),
    }
    playingPhraseId.value = phrase.id
    await composerApplication.playback.playPhrase(request)
    const totalBeats = phrase.bars * 4
    const tempo = request.tempo
    const startedAt = performance.now()
    playbackPositionTimer = setInterval(() => {
      const elapsedBeats = (performance.now() - startedAt) / 1000 * tempo / 60
      phrasePlaybackPositionBeats.value = loop ? elapsedBeats % totalBeats : Math.min(totalBeats, elapsedBeats)
    }, 50)
    if (!loop) {
      playbackTimer = setTimeout(() => {
        clearPlaybackTimer()
        phrasePlaybackPositionBeats.value = totalBeats
        playingPhraseId.value = null
      }, totalBeats * (60 / tempo) * 1000)
    }
  }

  function clearPlaybackTimer(): void {
    if (playbackTimer) clearTimeout(playbackTimer)
    playbackTimer = null
    if (playbackPositionTimer) clearInterval(playbackPositionTimer)
    playbackPositionTimer = null
  }

  function resetSongPlayback(): void {
    clearPlaybackTimer()
    playingPhraseId.value = null
    phrasePlaybackPositionBeats.value = 0
    playingSong.value = false
    playingSectionId.value = null
    sectionPlaybackPositionBeats.value = 0
    songPlaybackPositionSeconds.value = 0
    songPlaybackDurationSeconds.value = 0
  }

  async function playSong(startBeat?: number): Promise<void> {
    if (!project.value) return
    clearPlaybackTimer()
    const secondsPerBeat = 60 / project.value.frame.tempo
    const resumeBeat = songPlaybackPositionSeconds.value > 0 && songPlaybackPositionSeconds.value < songPlaybackDurationSeconds.value
      ? songPlaybackPositionSeconds.value / secondsPerBeat
      : 0
    const requestedStartBeat = startBeat ?? resumeBeat
    const startSeconds = requestedStartBeat * secondsPerBeat
    songPlaybackPositionSeconds.value = startSeconds
    playingPhraseId.value = null
    playingSectionId.value = null
    sectionPlaybackPositionBeats.value = 0
    phrasePlaybackPositionBeats.value = 0
    playbackError.value = null
    playingSong.value = true
    try {
      const duration = await composerApplication.playback.playSong(project.value, requestedStartBeat)
      if (duration <= 0) {
        playingSong.value = false
        playbackError.value = project.value.phrases.length ? 'Audio playback is unavailable in this environment.' : 'Add a phrase before playing the song.'
        return
      }
      songPlaybackDurationSeconds.value = duration
      const remainingDuration = Math.max(0, duration - startSeconds)
      if (remainingDuration <= 0) {
        playingSong.value = false
        songPlaybackPositionSeconds.value = duration
        return
      }
      const startedAt = performance.now()
      playbackPositionTimer = setInterval(() => {
        songPlaybackPositionSeconds.value = Math.min(duration, startSeconds + (performance.now() - startedAt) / 1000)
      }, 100)
      playbackTimer = setTimeout(() => {
        clearPlaybackTimer()
        songPlaybackPositionSeconds.value = duration
        playingSong.value = false
      }, remainingDuration * 1000)
    } catch (cause) {
      playingSong.value = false
      playbackError.value = cause instanceof Error ? cause.message : 'Unable to start playback.'
    }
  }

  async function playSection(sectionId: string, loop = true): Promise<void> {
    if (!project.value) return
    const section = project.value.sections.find((candidate) => candidate.id === sectionId)
    if (!section) return
    clearPlaybackTimer()
    await composerApplication.playback.stop()
    playingPhraseId.value = null
    playingSong.value = false
    playingSectionId.value = sectionId
    sectionPlaybackPositionBeats.value = 0
    playbackError.value = null

    const sectionClips = project.value.tracks.flatMap((track) => {
      const resolved = resolveSequenceClip(project.value!, track.id, sectionId)
      return resolved ? [{ ...resolved.clip, id: `${resolved.clip.id}:${sectionId}`, sectionId, sourceClipId: resolved.linked ? resolved.clip.id : resolved.clip.sourceClipId }] : []
    })
    const scopedProject: CompositionProject = {
      ...project.value,
      sections: [section],
      phrases: project.value.phrases.filter((phrase) => phrase.sectionId === sectionId),
      sequenceClips: sectionClips,
    }
    const secondsPerBeat = 60 / scopedProject.frame.tempo
    const durationSeconds = section.bars * 4 * secondsPerBeat
    const startedAt = performance.now()
    playbackPositionTimer = setInterval(() => {
      const elapsedBeats = (performance.now() - startedAt) / 1000 / secondsPerBeat
      sectionPlaybackPositionBeats.value = loop ? elapsedBeats % (section.bars * 4) : Math.min(section.bars * 4, elapsedBeats)
    }, 50)

    const playPass = async (): Promise<void> => {
      if (playingSectionId.value !== sectionId) return
      const duration = await composerApplication.playback.playSong(scopedProject, 0)
      if (duration <= 0) {
        clearPlaybackTimer()
        playingSectionId.value = null
        playbackError.value = 'Add notes or hits before looping this section.'
        return
      }
      playbackTimer = setTimeout(() => {
        if (loop && playingSectionId.value === sectionId) void playPass()
        else {
          clearPlaybackTimer()
          playingSectionId.value = null
          sectionPlaybackPositionBeats.value = section.bars * 4
        }
      }, durationSeconds * 1000)
    }
    await playPass()
  }

  async function seekSong(beat: number): Promise<void> {
    if (!project.value) return
    const preview = buildSongPreview(project.value)
    const safeBeat = Math.max(0, Math.min(beat, preview.totalBeats))
    clearPlaybackTimer()
    await composerApplication.playback.stop()
    playingPhraseId.value = null
    phrasePlaybackPositionBeats.value = 0
    playingSong.value = false
    playbackError.value = null
    songPlaybackDurationSeconds.value = preview.totalBeats * (60 / project.value.frame.tempo)
    songPlaybackPositionSeconds.value = safeBeat * (60 / project.value.frame.tempo)
    if (safeBeat < preview.totalBeats) await playSong(safeBeat)
  }

  async function stop(): Promise<void> {
    resetSongPlayback()
    await composerApplication.playback.stop()
    playingPhraseId.value = null
    playingSong.value = false
  }

  async function auditionChord(symbol: string): Promise<void> {
    const instrumentId = project.value?.tracks.find((track) => track.role === 'harmony')?.instrumentId
    await composerApplication.playback.auditionChord(symbol, instrumentId)
  }

  async function auditionNote(midiNote: number, role: TrackRole, instrumentId: string, volume?: number): Promise<void> {
    await composerApplication.playback.auditionNote(midiNote, role, instrumentId, volume)
  }

  function openSequenceEditor(trackId: string, sectionId: string): void {
    selectedSequenceTrackId.value = trackId
    selectedSectionId.value = sectionId
    selectedSequenceNoteId.value = null
  }

  function closeSequenceEditor(): void {
    selectedSequenceTrackId.value = null
    selectedSequenceNoteId.value = null
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
    project, projects, loading, saving, lastSavedAt, error, playingPhraseId, phrasePlaybackPositionBeats, playingSong, playingSectionId, sectionPlaybackPositionBeats, songPlaybackPositionSeconds, songPlaybackDurationSeconds, playbackError, selectedPhraseId, selectedSectionId, selectedSequenceTrackId, selectedSequenceNoteId,
    canUndo, canRedo, refreshLibrary, load, create, importProject, openExample, selectNativeProject, mutate, undo, redo, save, playPhrase, stop,
    playSong, playSection, seekSong, downloadProject, downloadMidi, auditionChord, auditionNote, openSequenceEditor, closeSequenceEditor,
  }
})
