<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import PhaseRail from '@presentation/components/shell/PhaseRail/PhaseRail.vue'
import WorkspaceLayout from '@presentation/components/shell/WorkspaceLayout/WorkspaceLayout.vue'
import StoryWorkspace from '@presentation/workspaces/StoryWorkspace/StoryWorkspace.vue'
import FrameWorkspace from '@presentation/workspaces/FrameWorkspace/FrameWorkspace.vue'
import EmotionWorkspace from '@presentation/workspaces/EmotionWorkspace/EmotionWorkspace.vue'
import StructureWorkspace from '@presentation/workspaces/StructureWorkspace/StructureWorkspace.vue'
import ComposeWorkspace from '@presentation/workspaces/ComposeWorkspace/ComposeWorkspace.vue'
import ArrangeWorkspace from '@presentation/workspaces/ArrangeWorkspace/ArrangeWorkspace.vue'
import ExportWorkspace from '@presentation/workspaces/ExportWorkspace/ExportWorkspace.vue'
import { useProjectStore } from '@presentation/stores/project.store'
import { resolveSequenceClip } from '@domain/project/project.sequence'
import { updateSequenceNote } from '@domain/project/project.operations'

const route = useRoute()
const store = useProjectStore()
const workspaces = { story: StoryWorkspace, frame: FrameWorkspace, emotions: EmotionWorkspace, structure: StructureWorkspace, compose: ComposeWorkspace, arrange: ArrangeWorkspace, export: ExportWorkspace }
const activeWorkspace = computed(() => workspaces[String(route.params.phase) as keyof typeof workspaces] ?? StoryWorkspace)
const sequenceTrack = computed(() => store.project?.tracks.find((track) => track.id === store.selectedSequenceTrackId) ?? null)
const sequenceSection = computed(() => store.project?.sections.find((section) => section.id === store.selectedSectionId) ?? null)
const sequenceClip = computed(() => store.project && sequenceTrack.value && sequenceSection.value ? resolveSequenceClip(store.project, sequenceTrack.value.id, sequenceSection.value.id)?.clip ?? null : null)
const selectedSequenceNote = computed(() => sequenceClip.value?.notes.find((note) => note.id === store.selectedSequenceNoteId) ?? null)
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function noteName(pitch: number): string {
  return `${noteNames[pitch % 12]}${Math.floor(pitch / 12) - 1}`
}

function updateSelectedSequenceNote(patch: Parameters<typeof updateSequenceNote>[3]): void {
  if (!sequenceClip.value || !selectedSequenceNote.value) return
  store.mutate('Edit sequence note', (project) => updateSequenceNote(project, sequenceClip.value!.id, selectedSequenceNote.value!.id, patch))
}

async function ensureProject(): Promise<void> {
  const id = String(route.params.projectId)
  if (store.project?.id !== id) await store.load(id)
}

onMounted(ensureProject)
watch(() => route.params.projectId, ensureProject)
watch(() => route.params.phase, (phase) => { if (phase !== 'arrange') store.closeSequenceEditor() })
</script>

<template>
  <WorkspaceLayout>
    <template #rail><PhaseRail /></template>
    <div v-if="store.loading" class="workspace-loading" role="status">Opening your local project…</div>
    <div v-else-if="store.error" class="workspace-error" role="alert">{{ store.error }}</div>
    <component :is="activeWorkspace" v-else-if="store.project" />
    <template #inspector>
      <section v-if="store.project && store.selectedSequenceTrackId" class="inspector inspector--sequence">
        <p class="eyebrow">{{ selectedSequenceNote ? (sequenceTrack?.role === 'rhythm' ? 'SELECTED HIT' : 'SELECTED NOTE') : 'SEQUENCE EDITOR' }}</p>
        <template v-if="selectedSequenceNote">
          <h2>{{ noteName(selectedSequenceNote.pitch) }}</h2>
          <p>{{ sequenceTrack?.role === 'rhythm' ? `${sequenceTrack.instrument} kit piece · MIDI ${selectedSequenceNote.pitch}` : `MIDI ${selectedSequenceNote.pitch} on ${sequenceTrack?.instrument}` }}</p>
          <hr />
          <p class="eyebrow">POSITION</p>
          <label class="inspector__sequence-field"><span>Starts at beat</span><input :value="selectedSequenceNote.startBeat" type="number" min="0" :max="(sequenceSection?.bars ?? 1) * 4" step="0.25" @change="updateSelectedSequenceNote({ startBeat: Number(($event.target as HTMLInputElement).value) })" /></label>
          <label class="inspector__sequence-field"><span>Length in beats</span><input :value="selectedSequenceNote.durationBeats" type="number" min="0.0625" :max="(sequenceSection?.bars ?? 1) * 4" step="0.25" @change="updateSelectedSequenceNote({ durationBeats: Number(($event.target as HTMLInputElement).value) })" /></label>
          <label class="inspector__sequence-field"><span>Velocity · {{ selectedSequenceNote.velocity }}</span><input :value="selectedSequenceNote.velocity" type="range" min="1" max="127" @input="updateSelectedSequenceNote({ velocity: Number(($event.target as HTMLInputElement).value) })" /></label>
          <hr />
          <p class="inspector__note">Use Select to inspect notes, Draw or Paint to add them, and Erase to remove them.</p>
        </template>
        <template v-else>
          <h2>{{ sequenceTrack?.name }}</h2>
          <p>{{ sequenceTrack?.instrument }} · {{ sequenceSection?.name }}</p>
          <hr />
          <p class="inspector__note">Choose Draw or Paint, then click the grid. Select a note or hit to edit its position, length, and velocity here.</p>
        </template>
      </section>
      <section v-else-if="store.project" class="inspector">
        <p class="eyebrow">PROJECT INTENT</p>
        <h2>{{ store.project.title }}</h2>
        <p>{{ store.project.sections.find((section) => section.id === store.selectedSectionId)?.narrativePurpose ?? 'Select a section to see its intention.' }}</p>
        <hr />
        <p class="eyebrow">FEATURED EMOTIONS</p>
        <ul>
          <li v-for="emotion in store.project.emotionPlan.featured" :key="emotion.id"><span :style="{ background: emotion.color }" />{{ emotion.name }}</li>
        </ul>
        <hr />
        <p class="inspector__note">Suggestions explain possibilities and never change the project until you accept them.</p>
      </section>
    </template>
  </WorkspaceLayout>
</template>

<style scoped src="./WorkspacePage.scss" lang="scss" />
