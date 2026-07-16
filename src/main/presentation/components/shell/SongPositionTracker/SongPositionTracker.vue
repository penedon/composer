<script setup lang="ts">
import { computed } from 'vue'

import { buildSongPreview } from '@domain/playback/songPreview'
import { projectSongPosition, projectSongSeekBeat } from '@domain/playback/songPosition'
import { useProjectStore } from '@presentation/stores/project.store'

const store = useProjectStore()

const preview = computed(() => store.project ? buildSongPreview(store.project) : null)
const totalDuration = computed(() => {
  if (store.songPlaybackDurationSeconds > 0) return store.songPlaybackDurationSeconds
  if (!store.project || !preview.value) return 0
  return preview.value.totalBeats * (60 / store.project.frame.tempo)
})
const position = computed(() => {
  if (!store.project || !preview.value) return null
  const beat = store.songPlaybackPositionSeconds * store.project.frame.tempo / 60
  return projectSongPosition(store.project, preview.value.sections, beat)
})
const playheadStyle = computed(() => ({ left: `${Math.min(1, Math.max(0, position.value?.progress ?? 0)) * 100}%` }))

function sectionIsComposed(sectionId: string): boolean {
  const range = preview.value?.sections.find((section) => section.sectionId === sectionId)
  return Boolean(range?.composedBeats)
}

function sectionPlaybackBars(sectionId: string): number {
  const range = preview.value?.sections.find((section) => section.sectionId === sectionId)
  return range ? range.composedBeats / 4 : 0
}

function seekSection(event: unknown, sectionId: string): void {
  if (!store.project || !preview.value) return
  const pointerEvent = event as { clientX: number; currentTarget: { getBoundingClientRect(): { left: number; width: number } } }
  const target = pointerEvent.currentTarget
  const bounds = target.getBoundingClientRect()
  const sectionProgress = bounds.width > 0 ? (pointerEvent.clientX - bounds.left) / bounds.width : 0
  const beat = projectSongSeekBeat(store.project, preview.value.sections, sectionId, sectionProgress)
  if (beat !== null) void store.seekSong(beat)
}

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}
</script>

<template>
  <section
    class="song-position"
    aria-label="Song position"
  >
    <div class="song-position__time">
      <span>Song position</span>
      <strong>{{ formatTime(store.songPlaybackPositionSeconds) }}</strong>
      <small>/ {{ formatTime(totalDuration) }}</small>
    </div>

    <div class="song-position__timeline-scroll">
      <div
        class="sr-only"
        role="progressbar"
        aria-label="Song preview progress"
        :aria-valuemin="0"
        :aria-valuemax="Math.max(1, Math.round(totalDuration))"
        :aria-valuenow="Math.round(store.songPlaybackPositionSeconds)"
        :aria-valuetext="`${formatTime(store.songPlaybackPositionSeconds)} of ${formatTime(totalDuration)}`"
      />
      <div
        v-if="store.project"
        class="song-position__timeline"
        role="group"
        aria-label="Song sections. Click any position to seek."
      >
        <button
          v-for="section in store.project.sections"
          :key="section.id"
          type="button"
          class="song-position__section"
          :class="{
            'is-active': position?.section.id === section.id,
            'is-uncomposed': !sectionIsComposed(section.id),
          }"
          :style="{ flexGrow: section.bars, '--section-color': section.color }"
          :aria-label="`${section.name}, ${sectionPlaybackBars(section.id)} of ${section.bars} bars composed`"
          @click="seekSection($event, section.id)"
        >
          <span>{{ section.name }}</span>
        </button>
        <div
          v-if="preview?.totalBeats"
          class="song-position__playhead"
          :style="playheadStyle"
          aria-hidden="true"
        >
          <span />
        </div>
      </div>
      <div
        v-else
        class="song-position__empty"
      >
        Open a project to see its song structure
      </div>
    </div>

    <div class="song-position__current">
      <span>Current section</span>
      <template v-if="position">
        <strong><i :style="{ backgroundColor: position.section.color }" />{{ position.section.name }}</strong>
        <small>bar {{ position.sectionBar }} / {{ position.section.bars }}</small>
      </template>
      <strong v-else>Not playable</strong>
    </div>
  </section>
</template>

<style scoped src="./SongPositionTracker.scss" lang="scss" />
