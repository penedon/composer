<script setup lang="ts">
import { useProjectStore } from '@presentation/stores/project.store'
import { updateFrame } from '@domain/project/project.operations'

const store = useProjectStore()
const genres = ['Alternative rock', 'Soul', 'Funk', 'Folk', 'Pop', 'Jazz', 'Custom']
const grooves = ['Slow pulse', 'Straight eighths', 'Syncopated', 'Half-time', 'Driving', 'Free']
</script>

<template>
  <section v-if="store.project" class="frame-workspace">
    <p class="eyebrow">MUSICAL FRAME</p><h1 class="page-heading">Give the story a rhythmic identity.</h1>
    <p class="page-copy">You choose the genre. Composer exposes useful consequences without treating them as rules.</p>
    <div class="frame-workspace__grid">
      <label class="field"><span>Genre</span><select :value="store.project.frame.genre" @change="store.mutate('Change genre', (project) => updateFrame(project, { genre: ($event.target as HTMLSelectElement).value }))"><option v-for="genre in genres" :key="genre">{{ genre }}</option></select></label>
      <label class="field"><span>Key</span><input :value="store.project.frame.key" @change="store.mutate('Change key', (project) => updateFrame(project, { key: ($event.target as HTMLInputElement).value }))" /></label>
      <label class="field"><span>Tempo · {{ store.project.frame.tempo }} BPM</span><input type="range" min="40" max="180" :value="store.project.frame.tempo" @input="store.mutate('Change tempo', (project) => updateFrame(project, { tempo: Number(($event.target as HTMLInputElement).value) }))" /></label>
      <label class="field"><span>Meter</span><select :value="store.project.frame.meter" @change="store.mutate('Change meter', (project) => updateFrame(project, { meter: ($event.target as HTMLSelectElement).value }))"><option>4/4</option><option>3/4</option><option>6/8</option><option>5/4</option></select></label>
      <label class="field"><span>Rhythmic identity</span><select :value="store.project.frame.groove" @change="store.mutate('Change groove', (project) => updateFrame(project, { groove: ($event.target as HTMLSelectElement).value }))"><option v-for="groove in grooves" :key="groove">{{ groove }}</option></select></label>
      <label class="field frame-workspace__references"><span>References or notes</span><textarea rows="4" :value="store.project.frame.references" @input="store.mutate('Edit references', (project) => updateFrame(project, { references: ($event.target as HTMLTextAreaElement).value }))" /></label>
    </div>
    <aside class="frame-workspace__reading"><p class="eyebrow">CURRENT READING</p><strong>{{ store.project.frame.genre }} · {{ store.project.frame.groove }}</strong><p>{{ store.project.frame.tempo }} BPM in {{ store.project.frame.meter }} gives the harmony enough room to breathe. Auditioning will remain neutral until you choose instruments.</p></aside>
  </section>
</template>

<style scoped src="./FrameWorkspace.scss" lang="scss" />
