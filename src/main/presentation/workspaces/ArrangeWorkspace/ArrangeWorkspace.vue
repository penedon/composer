<script setup lang="ts">
import { computed } from 'vue'

import { AppButton } from '@presentation/components/base/AppButton'
import SequenceEditor from '@presentation/components/arrangement/SequenceEditor/SequenceEditor.vue'
import { resolveSequenceClip } from '@domain/project/project.sequence'
import type { ArrangementTrack, SongSection } from '@domain/project/project.types'
import { updateFrame, toggleTrack, updateTrack } from '@domain/project/project.operations'
import { buildSectionTimelineLabels } from '@domain/structure/sectionTimelineLabels'
import { instrumentLabel, instrumentsForRole } from '@domain/arrangement/instrumentCatalog'
import { useProjectStore } from '@presentation/stores/project.store'

const store = useProjectStore()
const totalBars = computed(() => store.project?.sections.reduce((sum, section) => sum + section.bars, 0) ?? 0)
const sectionLabels = computed(() => new Map(buildSectionTimelineLabels(store.project?.sections ?? []).map((label) => [label.sectionId, label])))
function sequence(track: ArrangementTrack, section: SongSection) {
  return store.project ? resolveSequenceClip(store.project, track.id, section.id) : null
}

function acronym(section: SongSection): string {
  return sectionLabels.value.get(section.id)?.acronym ?? section.name.slice(0, 3).toUpperCase()
}

function cellLabel(track: ArrangementTrack, section: SongSection): string {
  const resolved = sequence(track, section)
  if (!resolved) return `Edit empty ${track.name} sequence for ${section.name}`
  return `${resolved.linked ? 'Linked' : 'Edit'} ${track.name} sequence for ${section.name}, ${resolved.clip.notes.length} notes`
}

function noteStyle(track: ArrangementTrack, section: SongSection, startBeat: number, pitch: number): Record<string, string> {
  const width = Math.max(1, section.bars * 4)
  return {
    left: `${Math.min(94, startBeat / width * 100)}%`,
    top: track.role === 'rhythm' ? `${20 + (pitch % 4) * 18}%` : `${12 + (1 - (pitch - 36) / 48) * 72}%`,
  }
}
</script>

<template>
  <SequenceEditor v-if="store.selectedSequenceTrackId" />

  <section v-else-if="store.project" class="arrange-workspace">
    <p class="eyebrow">RHYTHM &amp; ARRANGEMENT</p>
    <h1 class="page-heading">Give the emotional arc a body.</h1>
    <p class="page-copy">Shape pulse and instrumentation, then open any track and section to write its melody or rhythm.</p>

    <div class="arrange-workspace__rhythm">
      <label class="field"><span>Tempo</span><div><input :value="store.project.frame.tempo" type="range" min="45" max="190" @input="store.mutate('Update tempo', (project) => updateFrame(project, { tempo: Number(($event.target as HTMLInputElement).value) }))" /><output>{{ store.project.frame.tempo }} BPM</output></div></label>
      <label class="field"><span>Meter</span><select :value="store.project.frame.meter" @change="store.mutate('Update meter', (project) => updateFrame(project, { meter: ($event.target as HTMLSelectElement).value }))"><option>4/4</option><option>3/4</option><option>6/8</option><option>5/4</option></select></label>
      <label class="field"><span>Groove</span><select :value="store.project.frame.groove" @change="store.mutate('Update groove', (project) => updateFrame(project, { groove: ($event.target as HTMLSelectElement).value }))"><option>Slow pulse</option><option>Walking pulse</option><option>Straight eighths</option><option>Gentle swing</option><option>Syncopated</option><option>Half-time</option><option>Driving</option><option>Free</option></select></label>
    </div>

    <div class="arrange-workspace__timeline" aria-label="Song section timeline">
      <button
        v-for="section in store.project.sections"
        :key="section.id"
        type="button"
        :style="{ flexGrow: section.bars, '--section-color': section.color }"
        :aria-label="`${section.name}, ${section.bars} bars`"
        :aria-pressed="section.id === store.selectedSectionId"
        :title="section.name"
        @click="store.selectedSectionId = section.id"
      >
        <strong>{{ acronym(section) }}</strong>
        <span>{{ section.name }}</span>
        <small>
          {{ section.bars }}
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3v10M14 3v10M2 5h12M2 11h12" /></svg>
        </small>
      </button>
    </div>
    <p class="arrange-workspace__summary">{{ totalBars }} total bars · {{ store.project.tracks.length }} separate instrument tracks · select a pattern cell to edit</p>

    <div class="arrange-workspace__tracks">
      <article v-for="track in store.project.tracks" :key="track.id" :class="{ 'is-muted': track.muted }">
        <div class="arrange-workspace__track-controls">
          <div class="arrange-workspace__track-title"><span>{{ track.role.slice(0, 1).toUpperCase() }}</span><div><strong>{{ track.name }}</strong><small>{{ track.role === 'rhythm' ? 'drum sequencer' : 'piano sequencer' }}</small></div></div>
          <label><span class="sr-only">Instrument for {{ track.name }}</span><select :value="track.instrumentId" @change="store.mutate('Change instrument', (project) => updateTrack(project, track.id, { instrumentId: ($event.target as HTMLSelectElement).value }))"><option v-if="!instrumentsForRole(track.role).some((instrument) => instrument.id === track.instrumentId)" :value="track.instrumentId">{{ instrumentLabel(track.instrumentId) }}</option><option v-for="instrument in instrumentsForRole(track.role)" :key="instrument.id" :value="instrument.id">{{ instrument.label }}</option></select></label>
          <label class="arrange-workspace__volume"><span class="sr-only">Volume for {{ track.name }}</span><input :value="track.volume" type="range" min="0" max="1" step="0.01" @input="store.mutate('Update track volume', (project) => updateTrack(project, track.id, { volume: Number(($event.target as HTMLInputElement).value) }))" /></label>
          <div class="arrange-workspace__track-toggles"><AppButton :variant="track.muted ? 'primary' : 'ghost'" :aria-pressed="track.muted" @click="store.mutate('Toggle track mute', (project) => toggleTrack(project, track.id, 'muted'))">M</AppButton><AppButton :variant="track.solo ? 'primary' : 'ghost'" :aria-pressed="track.solo" @click="store.mutate('Toggle track solo', (project) => toggleTrack(project, track.id, 'solo'))">S</AppButton></div>
        </div>

        <div class="arrange-workspace__patterns" :aria-label="`${track.name} section sequences`">
          <button
            v-for="section in store.project.sections"
            :key="section.id"
            type="button"
            :class="{ 'is-selected': section.id === store.selectedSectionId, 'is-linked': sequence(track, section)?.linked, 'is-populated': sequence(track, section)?.clip.notes.length }"
            :style="{ flexGrow: section.bars, '--section-color': section.color }"
            :aria-label="cellLabel(track, section)"
            @click="store.openSequenceEditor(track.id, section.id)"
          >
            <span class="arrange-workspace__pattern-name" :title="section.name">{{ acronym(section) }}</span>
            <i
              v-for="note in sequence(track, section)?.clip.notes.slice(0, 14) ?? []"
              :key="note.id"
              :style="noteStyle(track, section, note.startBeat, note.pitch)"
              aria-hidden="true"
            />
            <small v-if="sequence(track, section)?.linked">linked</small>
            <small v-else-if="!sequence(track, section)?.clip.notes.length">＋</small>
          </button>
        </div>
      </article>
    </div>
    <p class="arrange-workspace__note">Sequences are saved with the project and preserved as separate tracks in exported MIDI. Audio effects and final mixing remain the job of your DAW.</p>
  </section>
</template>

<style scoped src="./ArrangeWorkspace.scss" lang="scss" />
