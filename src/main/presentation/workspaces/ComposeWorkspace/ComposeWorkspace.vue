<script setup lang="ts">
import { computed, watch } from 'vue'

import { AppButton } from '@presentation/components/base/AppButton'
import PhraseBlock from '@presentation/components/composition/PhraseBlock/PhraseBlock.vue'
import { useProjectStore } from '@presentation/stores/project.store'
import { addChord, addPhrase, createPhraseAlternative, mergePhraseWithNext, movePhrase, removePhrase, restorePhraseAlternative, splitPhrase, updatePhrase } from '@domain/project/project.operations'
import type { Phrase } from '@domain/project/project.types'
import { projectSongPhrasePlayback } from '@domain/playback/songPosition'

const store = useProjectStore()
const selectedSection = computed(() => store.project?.sections.find((section) => section.id === store.selectedSectionId))
const phrases = computed(() => store.project?.phrases
  .filter((phrase) => phrase.sectionId === store.selectedSectionId)
  .sort((a, b) => a.order - b.order) ?? [])
const songPhrasePlayback = computed(() => {
  if (!store.project || !store.playingSong) return null
  const songBeat = store.songPlaybackPositionSeconds * store.project.frame.tempo / 60
  return projectSongPhrasePlayback(store.project, songBeat)
})

watch(songPhrasePlayback, (playback) => {
  if (!playback) return
  store.selectedSectionId = playback.sectionId
  store.selectedPhraseId = playback.phraseId
})

function emotionFor(phrase: Phrase) {
  return store.project?.emotionPlan.featured.find((emotion) => emotion.id === phrase.emotionId)
}

function playbackBeatFor(phrase: Phrase): number | null {
  if (store.playingPhraseId === phrase.id) return store.phrasePlaybackPositionBeats
  return songPhrasePlayback.value?.phraseId === phrase.id ? songPhrasePlayback.value.beat : null
}

function playAndSelectNext(phrase: Phrase): void {
  void store.playPhrase(phrase)
  const next = phrases.value.find((candidate) => candidate.order === phrase.order + 1)
  if (next) store.selectedPhraseId = next.id
}

function createPhrase(instrumental = false): void {
  if (!store.selectedSectionId) return
  store.mutate('Add phrase', (project) => addPhrase(project, store.selectedSectionId, instrumental))
}
</script>

<template>
  <section v-if="store.project" class="compose-workspace">
    <header class="compose-workspace__heading">
      <div><p class="eyebrow">PHRASE WORKSPACE</p><h1 class="page-heading">Write in playable thoughts.</h1></div>
      <div class="compose-workspace__context">
        <span>{{ store.project.frame.key }}</span><span>{{ store.project.frame.tempo }} BPM</span><span>{{ store.project.frame.meter }}</span>
      </div>
    </header>
    <p class="page-copy">Lyrics, harmony, emotion, rhythm, and dynamics stay together in one phrase. Press Shift + Enter while writing to play and advance.</p>

    <nav class="compose-workspace__sections" aria-label="Choose song section">
      <button v-for="section in store.project.sections" :key="section.id" type="button" :aria-pressed="section.id === store.selectedSectionId" :style="{ '--section-color': section.color }" @click="store.selectedSectionId = section.id">
        <span />{{ section.name }}<small>{{ section.bars }} bars</small>
      </button>
    </nav>

    <aside v-if="selectedSection" class="compose-workspace__intention">
      <span>SECTION INTENTION</span><strong>{{ selectedSection.narrativePurpose || 'Add a narrative purpose in Structure.' }}</strong>
    </aside>

    <div class="compose-workspace__phrases" aria-live="polite">
      <PhraseBlock
        v-for="phrase in phrases"
        :key="phrase.id"
        :phrase="phrase"
        :active="phrase.id === store.selectedPhraseId"
        :playing="playbackBeatFor(phrase) !== null"
        :playback-beat="playbackBeatFor(phrase)"
        :emotion-name="emotionFor(phrase)?.name ?? 'Unassigned'"
        :emotion-color="emotionFor(phrase)?.color ?? '#8f9489'"
        :key-signature="store.project.frame.key"
        @select="store.selectedPhraseId = phrase.id"
        @update-lyrics="store.mutate('Update phrase lyrics', (project) => updatePhrase(project, phrase.id, { lyrics: $event }))"
        @add-chord="store.mutate('Add chord', (project) => addChord(project, phrase.id, $event))"
        @play="store.playPhrase(phrase, $event)"
        @loop="store.playPhrase(phrase, false, true)"
        @alternative="store.mutate('Create phrase alternative', (project) => createPhraseAlternative(project, phrase.id))"
        @audition-chord="store.auditionChord"
        @move="store.mutate('Move phrase', (project) => movePhrase(project, phrase.id, $event))"
        @split="store.mutate('Split phrase', (project) => splitPhrase(project, phrase.id))"
        @merge="store.mutate('Merge phrases', (project) => mergePhraseWithNext(project, phrase.id))"
        @remove="store.mutate('Remove phrase', (project) => removePhrase(project, phrase.id))"
        @play-next="playAndSelectNext(phrase)"
      />
      <div v-if="phrases.length === 0" class="compose-workspace__empty">
        <strong>This section has no phrases yet.</strong><span>Add a lyrical or instrumental thought to begin.</span>
      </div>
    </div>
    <footer class="compose-workspace__actions">
      <AppButton variant="primary" @click="createPhrase(false)">+ Add lyric phrase</AppButton>
      <AppButton @click="createPhrase(true)">+ Add instrumental phrase</AppButton>
      <span>{{ store.project.alternatives.length }} saved alternative{{ store.project.alternatives.length === 1 ? '' : 's' }}</span>
    </footer>
    <section v-if="store.project.alternatives.length" class="compose-workspace__alternatives">
      <p class="eyebrow">SAVED ALTERNATIVES</p>
      <article v-for="alternative in store.project.alternatives" :key="alternative.id"><div><strong>{{ alternative.name }}</strong><span>{{ alternative.phrase.lyrics || 'Instrumental phrase' }}</span></div><AppButton variant="ghost" @click="store.mutate('Restore phrase alternative', (project) => restorePhraseAlternative(project, alternative.id))">Restore snapshot</AppButton></article>
    </section>
  </section>
</template>

<style scoped src="./ComposeWorkspace.scss" lang="scss" />
