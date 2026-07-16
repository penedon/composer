<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { addSequenceNote, makeSequenceVariation, removeSequenceNote, updateSequenceNote } from '@domain/project/project.operations'
import { resolveSequenceClip } from '@domain/project/project.sequence'
import type { MidiNoteEvent } from '@domain/project/project.types'
import { buildSectionTimelineLabels } from '@domain/structure/sectionTimelineLabels'
import { gmDrumMap } from '@domain/arrangement/gmDrumMap'
import { instrumentLabel } from '@domain/arrangement/instrumentCatalog'
import { useProjectStore } from '@presentation/stores/project.store'

type EditTool = 'select' | 'draw' | 'erase'

const store = useProjectStore()
const tool = ref<EditTool>('draw')
const stepBeats = ref(.25)
const usedRowsOnly = ref(false)
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const pitchClasses: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 }

const track = computed(() => store.project?.tracks.find((candidate) => candidate.id === store.selectedSequenceTrackId) ?? null)
const section = computed(() => store.project?.sections.find((candidate) => candidate.id === store.selectedSectionId) ?? null)
const sectionLabels = computed(() => new Map(buildSectionTimelineLabels(store.project?.sections ?? []).map((label) => [label.sectionId, label])))
const resolved = computed(() => store.project && track.value && section.value ? resolveSequenceClip(store.project, track.value.id, section.value.id) : null)
const clip = computed(() => resolved.value?.clip ?? null)
const linked = computed(() => Boolean(resolved.value?.linked))
const isDrums = computed(() => track.value?.role === 'rhythm')
const totalBeats = computed(() => (section.value?.bars ?? 1) * 4)
const steps = computed(() => Math.round(totalBeats.value / stepBeats.value))
const stepValues = computed(() => Array.from({ length: steps.value }, (_, index) => index * stepBeats.value))
const allPianoRows = computed(() => {
  const existingTop = clip.value?.notes.length ? Math.max(...clip.value.notes.map((note) => note.pitch)) + 3 : null
  const fallbackTop = track.value?.role === 'bass' ? 52 : 76
  const top = Math.max(24, Math.min(108, existingTop ?? fallbackTop))
  return Array.from({ length: 25 }, (_, index) => top - index)
})
const visiblePianoRows = computed(() => {
  if (!usedRowsOnly.value || !clip.value?.notes.length) return allPianoRows.value
  return [...new Set(clip.value.notes.map((note) => note.pitch))].sort((left, right) => right - left)
})
const activeRows = computed(() => isDrums.value ? gmDrumMap : visiblePianoRows.value.map((pitch) => ({ pitch, name: noteName(pitch) })))
const selectedNote = computed(() => clip.value?.notes.find((note) => note.id === store.selectedSequenceNoteId) ?? null)
const playheadPercent = computed(() => store.playingSectionId === section.value?.id ? Math.min(100, store.sectionPlaybackPositionBeats / totalBeats.value * 100) : 0)
const playheadLeft = computed(() => 144 + playheadPercent.value / 100 * steps.value * 18)
const scalePitchClasses = computed(() => {
  const key = store.project?.frame.key ?? 'C major'
  const [rootName = 'C', quality = 'major'] = key.split(/\s+/)
  const root = pitchClasses[rootName.replace('♭', 'b').replace('♯', '#')] ?? 0
  const intervals = quality.toLowerCase().includes('minor') ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]
  return new Set(intervals.map((interval) => (root + interval) % 12))
})

watch(() => store.selectedSectionId, () => { store.selectedSequenceNoteId = null })

function noteName(pitch: number): string {
  return `${noteNames[pitch % 12]}${Math.floor(pitch / 12) - 1}`
}

function sectionAcronym(sectionId: string): string {
  return sectionLabels.value.get(sectionId)?.acronym ?? 'S'
}

function notesStartingAt(pitch: number, beat: number): MidiNoteEvent | null {
  return clip.value?.notes.find((note) => note.pitch === pitch && Math.abs(note.startBeat - beat) < .001) ?? null
}

function noteCovering(pitch: number, beat: number): MidiNoteEvent | null {
  return clip.value?.notes.find((note) => note.pitch === pitch && beat >= note.startBeat && beat < note.startBeat + note.durationBeats) ?? null
}

function cellClass(pitch: number, beat: number): Record<string, boolean> {
  const note = noteCovering(pitch, beat)
  return {
    'is-active': Boolean(note),
    'is-start': Boolean(notesStartingAt(pitch, beat)),
    'is-selected': Boolean(note && note.id === store.selectedSequenceNoteId),
    'is-beat': Math.abs(beat % 1) < .001,
    'is-bar': Math.abs(beat % 4) < .001,
  }
}

function cellLabel(pitch: number, beat: number, rowName: string): string {
  const bar = Math.floor(beat / 4) + 1
  const beatInBar = Number(((beat % 4) + 1).toFixed(2))
  const active = noteCovering(pitch, beat)
  return `${rowName}, bar ${bar}, beat ${beatInBar}${active ? `, velocity ${active.velocity}` : ', empty'}`
}

function editCell(pitch: number, beat: number): void {
  if (!store.project || !track.value || !section.value || linked.value) return
  const existing = noteCovering(pitch, beat)
  if (tool.value === 'select') {
    store.selectedSequenceNoteId = existing?.id ?? null
    return
  }
  if (tool.value === 'erase' || (isDrums.value && existing)) {
    if (existing && clip.value) {
      store.mutate('Remove sequence note', (project) => removeSequenceNote(project, clip.value!.id, existing.id))
      if (store.selectedSequenceNoteId === existing.id) store.selectedSequenceNoteId = null
    }
    return
  }
  if (existing) {
    store.selectedSequenceNoteId = existing.id
    return
  }
  const durationBeats = isDrums.value ? stepBeats.value : Math.max(.5, stepBeats.value)
  store.mutate('Add sequence note', (project) => addSequenceNote(project, track.value!.id, section.value!.id, { pitch, startBeat: beat, durationBeats, velocity: isDrums.value ? 100 : 88 }))
  store.selectedSequenceNoteId = resolveSequenceClip(store.project, track.value.id, section.value.id)?.clip.notes.find((note) => note.pitch === pitch && Math.abs(note.startBeat - beat) < .001)?.id ?? null
}

function createVariation(): void {
  if (!store.project || !track.value || !section.value) return
  store.mutate('Make sequence variation', (project) => makeSequenceVariation(project, track.value!.id, section.value!.id))
}

function toggleSectionLoop(): void {
  if (!section.value) return
  if (store.playingSectionId === section.value.id) void store.stop()
  else void store.playSection(section.value.id, true)
}

function audition(pitch: number): void {
  if (!track.value) return
  void store.auditionNote(pitch, track.value.role, track.value.instrumentId, track.value.volume)
}
</script>

<template>
  <section v-if="store.project && track && section" class="sequence-editor">
    <header class="sequence-editor__heading">
      <div>
        <p class="eyebrow">ARRANGE / {{ track.name.toUpperCase() }} / {{ section.name.toUpperCase() }}</p>
        <h1>{{ isDrums ? 'Shape the pulse by drum part.' : `Write the line ${track.name.toLowerCase()} will carry.` }}</h1>
        <p>{{ isDrums ? 'Paint hits into named rows; the grid still writes ordinary MIDI to this track.' : 'Draw pitch and duration while the rest of the arrangement stays in reach.' }}</p>
      </div>
      <button type="button" class="sequence-editor__back" @click="store.closeSequenceEditor">← Back to arrangement</button>
    </header>

    <nav class="sequence-editor__sections" aria-label="Song sections">
      <span>Song sections</span>
      <button
        v-for="candidate in store.project.sections"
        :key="candidate.id"
        type="button"
        :class="{ 'is-current': candidate.id === section.id }"
        :style="{ '--section-color': candidate.color }"
        :aria-label="`${candidate.name}, ${candidate.bars} bars`"
        :title="candidate.name"
        @click="store.selectedSectionId = candidate.id"
      >
        <strong>{{ sectionAcronym(candidate.id) }}</strong>
        <small>{{ candidate.name }}</small>
        <span class="sequence-editor__section-bars">
          {{ candidate.bars }}
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3v10M14 3v10M2 5h12M2 11h12" /></svg>
        </span>
      </button>
    </nav>

    <div v-if="linked" class="sequence-editor__linked" role="status">
      <span>This sequence follows {{ resolved?.sourceSectionId }}.</span>
      <button type="button" @click="createVariation">Make variation</button>
    </div>

    <div class="sequence-editor__toolbar" aria-label="Sequence editing tools">
      <div class="sequence-editor__tooltip-control">
        <button
          type="button"
          class="sequence-editor__loop"
          :aria-pressed="store.playingSectionId === section.id"
          aria-label="Loop section"
          aria-describedby="sequence-loop-tooltip"
          @click="toggleSectionLoop"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 7H10a5 5 0 0 0-5 5M7 4 4 7l3 3M7.5 17H14a5 5 0 0 0 5-5M17 20l3-3-3-3"/><path d="m10 9 6 3-6 3z"/></svg>
          <span id="sequence-loop-tooltip" role="tooltip">Loop section</span>
        </button>
      </div>
      <div class="sequence-editor__tool-group" aria-label="Edit tool">
        <button v-for="choice in (['select', 'draw', 'erase'] as EditTool[])" :key="choice" type="button" :aria-pressed="tool === choice" @click="tool = choice">{{ choice === 'draw' && isDrums ? 'Paint' : choice }}</button>
      </div>
      <label>Grid
        <select v-model.number="stepBeats">
          <option :value="1">1/4</option><option :value=".5">1/8</option><option :value=".25">1/16</option>
        </select>
      </label>
      <button v-if="!isDrums" type="button" class="sequence-editor__filter" aria-pressed="true">In key · {{ store.project.frame.key }}</button>
      <button type="button" class="sequence-editor__filter" :aria-pressed="usedRowsOnly" @click="usedRowsOnly = !usedRowsOnly">Used rows</button>
      <span class="sequence-editor__count">{{ clip?.notes.length ?? 0 }} {{ isDrums ? 'hits' : 'notes' }}</span>
    </div>

    <div class="sequence-editor__surface" :class="{ 'is-locked': linked }">
      <div class="sequence-editor__surface-header">
        <span>{{ instrumentLabel(track.instrumentId) }} · {{ section.name }}</span>
        <span>{{ section.bars }} bars · scroll horizontally to edit the full section</span>
      </div>
      <div class="sequence-editor__scroll">
        <div class="sequence-editor__grid" :style="{ '--sequence-columns': steps }">
          <div class="sequence-editor__corner" />
          <div class="sequence-editor__ruler" :style="{ gridTemplateColumns: `repeat(${steps}, var(--sequence-step-width))` }">
            <span v-for="beat in stepValues" :key="beat" :class="{ 'is-beat': beat % 1 === 0, 'is-bar': beat % 4 === 0 }">{{ beat % 4 === 0 ? Math.floor(beat / 4) + 1 : '' }}</span>
          </div>

          <template v-for="row in activeRows" :key="row.pitch">
            <button type="button" class="sequence-editor__row-label" :class="{ 'is-piano': !isDrums, 'is-scale': !isDrums && scalePitchClasses.has(row.pitch % 12) }" :aria-label="`Audition ${row.name}`" @click="audition(row.pitch)">
              <span aria-hidden="true">▶</span><strong>{{ row.name }}</strong><small v-if="isDrums">{{ noteName(row.pitch) }}</small>
            </button>
            <div class="sequence-editor__row" :class="{ 'is-scale': !isDrums && scalePitchClasses.has(row.pitch % 12) }" :style="{ gridTemplateColumns: `repeat(${steps}, var(--sequence-step-width))` }">
              <button
                v-for="beat in stepValues"
                :key="beat"
                type="button"
                :class="cellClass(row.pitch, beat)"
                :aria-label="cellLabel(row.pitch, beat, row.name)"
                @click="editCell(row.pitch, beat)"
              />
            </div>
          </template>
          <div v-if="store.playingSectionId === section.id" class="sequence-editor__playhead" :style="{ left: `${playheadLeft}px` }" />
        </div>
      </div>

      <div class="sequence-editor__velocity">
        <div><span>Velocity</span><strong>{{ selectedNote?.velocity ?? 'Select a note' }}</strong></div>
        <input
          :value="selectedNote?.velocity ?? 88"
          type="range"
          min="1"
          max="127"
          :disabled="!selectedNote || linked"
          aria-label="Selected note velocity"
          @input="selectedNote && clip && store.mutate('Change note velocity', (project) => updateSequenceNote(project, clip!.id, selectedNote!.id, { velocity: Number(($event.target as HTMLInputElement).value) }))"
        />
      </div>
    </div>
  </section>
</template>

<style scoped src="./SequenceEditor.scss" lang="scss" />
