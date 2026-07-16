<script setup lang="ts">
import { computed } from 'vue'

import { AppButton } from '@presentation/components/base/AppButton'
import { useProjectStore } from '@presentation/stores/project.store'
import { instrumentLabel } from '@domain/arrangement/instrumentCatalog'

const store = useProjectStore()
const phraseCount = computed(() => store.project?.phrases.length ?? 0)
const chordCount = computed(() => store.project?.phrases.reduce((sum, phrase) => sum + phrase.chords.length, 0) ?? 0)
const emptySections = computed(() => store.project?.sections.filter((section) => !store.project?.phrases.some((phrase) => phrase.sectionId === section.id)) ?? [])
</script>

<template>
  <section v-if="store.project" class="export-workspace">
    <p class="eyebrow">SAVE &amp; EXPORT</p><h1 class="page-heading">Take the composition with you.</h1>
    <p class="page-copy">The project file keeps every editable decision. MIDI carries the tempo, harmony, structure, and separated instrument tracks into a DAW.</p>

    <div class="export-workspace__readiness">
      <div><strong>{{ store.project.sections.length }}</strong><span>sections</span></div><div><strong>{{ phraseCount }}</strong><span>phrases</span></div><div><strong>{{ chordCount }}</strong><span>chord events</span></div><div><strong>{{ store.project.tracks.length }}</strong><span>MIDI tracks</span></div>
    </div>

    <div v-if="emptySections.length" class="export-workspace__warning" role="note"><strong>Some sections have no written phrases.</strong><span>{{ emptySections.map((section) => section.name).join(', ') }} will still appear in the project structure, but produce no harmony notes.</span></div>

    <div class="export-workspace__formats">
      <article>
        <span class="export-workspace__icon">♪</span><div><p class="eyebrow">STANDARD MIDI FILE</p><h2>Continue in your DAW</h2><p>Type 1 MIDI with a tempo map and separate harmony, bass, rhythm, and melody tracks.</p><ul><li v-for="track in store.project.tracks" :key="track.id">{{ track.name }} · {{ instrumentLabel(track.instrumentId) }}</li></ul></div>
        <AppButton variant="primary" size="large" @click="store.downloadMidi">Export MIDI</AppButton>
      </article>
      <article>
        <span class="export-workspace__icon">{ }</span><div><p class="eyebrow">COMPOSER PROJECT</p><h2>Keep every decision editable</h2><p>Portable JSON containing the story, emotional arc, structure, phrases, alternatives, and arrangement.</p><small>Schema version {{ store.project.schemaVersion }} · local-first, no account required</small></div>
        <AppButton size="large" @click="store.downloadProject">Download project</AppButton>
      </article>
    </div>
    <p class="export-workspace__privacy">Your composition stays in this browser unless you explicitly download or import a file.</p>
  </section>
</template>

<style scoped src="./ExportWorkspace.scss" lang="scss" />
