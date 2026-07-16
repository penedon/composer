<script setup lang="ts">
import { computed } from 'vue'

import { AppButton } from '@presentation/components/base/AppButton'
import { updateFrame, toggleTrack, updateTrack } from '@domain/project/project.operations'
import { useProjectStore } from '@presentation/stores/project.store'

const store = useProjectStore()
const totalBars = computed(() => store.project?.sections.reduce((sum, section) => sum + section.bars, 0) ?? 0)
const instruments: Record<string, string[]> = {
  harmony: ['Soft piano', 'Electric piano', 'Nylon guitar', 'Warm strings'],
  bass: ['Upright bass', 'Electric bass', 'Synth bass', 'Cello'],
  rhythm: ['Brush kit', 'Acoustic kit', 'Electronic kit', 'Hand percussion'],
  melody: ['Voice', 'Electric guitar', 'Flute', 'Synth lead'],
}
</script>

<template>
  <section v-if="store.project" class="arrange-workspace">
    <p class="eyebrow">RHYTHM &amp; ARRANGEMENT</p><h1 class="page-heading">Give the emotional arc a body.</h1>
    <p class="page-copy">Shape pulse and instrumentation without flattening the separate tracks you will need in MIDI.</p>

    <div class="arrange-workspace__rhythm">
      <label class="field"><span>Tempo</span><div><input :value="store.project.frame.tempo" type="range" min="45" max="190" @input="store.mutate('Update tempo', (project) => updateFrame(project, { tempo: Number(($event.target as HTMLInputElement).value) }))" /><output>{{ store.project.frame.tempo }} BPM</output></div></label>
      <label class="field"><span>Meter</span><select :value="store.project.frame.meter" @change="store.mutate('Update meter', (project) => updateFrame(project, { meter: ($event.target as HTMLSelectElement).value }))"><option>4/4</option><option>3/4</option><option>6/8</option><option>5/4</option></select></label>
      <label class="field"><span>Groove</span><select :value="store.project.frame.groove" @change="store.mutate('Update groove', (project) => updateFrame(project, { groove: ($event.target as HTMLSelectElement).value }))"><option>Slow pulse</option><option>Straight eighths</option><option>Gentle swing</option><option>Syncopated</option><option>Half-time</option></select></label>
    </div>

    <div class="arrange-workspace__timeline" aria-label="Song section timeline">
      <button v-for="section in store.project.sections" :key="section.id" type="button" :style="{ flexGrow: section.bars, '--section-color': section.color }" :aria-pressed="section.id === store.selectedSectionId" @click="store.selectedSectionId = section.id">
        <span>{{ section.name }}</span><small>{{ section.bars }}</small>
      </button>
    </div>
    <p class="arrange-workspace__summary">{{ totalBars }} total bars · {{ store.project.tracks.length }} separate instrument tracks</p>

    <div class="arrange-workspace__tracks">
      <article v-for="track in store.project.tracks" :key="track.id" :class="{ 'is-muted': track.muted }">
        <div class="arrange-workspace__track-title"><span>{{ track.role.slice(0, 1).toUpperCase() }}</span><div><strong>{{ track.name }}</strong><small>{{ track.role }} track</small></div></div>
        <label><span class="sr-only">Instrument for {{ track.name }}</span><select :value="track.instrument" @change="store.mutate('Change instrument', (project) => updateTrack(project, track.id, { instrument: ($event.target as HTMLSelectElement).value }))"><option v-for="instrument in instruments[track.role]" :key="instrument">{{ instrument }}</option></select></label>
        <label class="arrange-workspace__volume"><span class="sr-only">Volume for {{ track.name }}</span><input :value="track.volume" type="range" min="0" max="1" step="0.01" @input="store.mutate('Update track volume', (project) => updateTrack(project, track.id, { volume: Number(($event.target as HTMLInputElement).value) }))" /></label>
        <div><AppButton :variant="track.muted ? 'primary' : 'ghost'" :aria-pressed="track.muted" @click="store.mutate('Toggle track mute', (project) => toggleTrack(project, track.id, 'muted'))">M</AppButton><AppButton :variant="track.solo ? 'primary' : 'ghost'" :aria-pressed="track.solo" @click="store.mutate('Toggle track solo', (project) => toggleTrack(project, track.id, 'solo'))">S</AppButton></div>
      </article>
    </div>
    <p class="arrange-workspace__note">Track separation is preserved in exported MIDI. Audio effects and final mixing remain the job of your DAW.</p>
  </section>
</template>

<style scoped src="./ArrangeWorkspace.scss" lang="scss" />
