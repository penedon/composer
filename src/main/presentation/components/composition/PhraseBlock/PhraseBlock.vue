<script setup lang="ts">
import { computed, ref } from 'vue'

import { analyzeChord, suggestNextChords } from '@domain/harmony/chords'
import type { PhraseBlockProps } from './PhraseBlock.types'

const props = defineProps<PhraseBlockProps>()
const emit = defineEmits<{
  select: []
  updateLyrics: [value: string]
  addChord: [symbol: string]
  play: [leadIn: boolean]
  loop: []
  alternative: []
  auditionChord: [symbol: string]
  playNext: []
  move: [direction: -1 | 1]
  split: []
  merge: []
  remove: []
}>()

const showSuggestions = ref(false)
const showActionsMenu = ref(false)
const lastChord = computed(() => props.phrase.chords.at(-1)?.symbol ?? '')
const suggestions = computed(() => suggestNextChords(lastChord.value, props.keySignature).slice(0, 5))
const controlId = computed(() => `phrase-${props.phrase.id}`)
const playingChordId = computed(() => {
  if (props.playbackBeat === null) return null
  return props.phrase.chords.find((chord) => props.playbackBeat! >= chord.beat && props.playbackBeat! < chord.beat + chord.duration)?.id ?? null
})

function keydown(event: KeyboardEvent): void {
  if (event.shiftKey && event.key === 'Enter') {
    event.preventDefault()
    emit('playNext')
  }
}

function selectPhrase(): void {
  showActionsMenu.value = false
  emit('select')
}

function closeActionsMenu(): void {
  showActionsMenu.value = false
}
</script>

<template>
  <article class="phrase-block" :class="{ 'phrase-block--active': active, 'phrase-block--playing': playing }" :style="{ '--emotion-color': emotionColor }" @click="selectPhrase" @keydown.esc.stop="closeActionsMenu">
    <header><span>PHRASE {{ phrase.order + 1 }} · {{ phrase.bars }} BARS</span><span>{{ emotionName }}</span></header>
    <div class="phrase-block__chords" aria-label="Chord events">
      <button v-for="chord in phrase.chords" :key="chord.id" type="button" :class="{ 'is-playing': chord.id === playingChordId }" :style="{ left: `${Math.min(88, (chord.beat / (phrase.bars * 4)) * 100)}%` }" :aria-label="`${chord.symbol}, beat ${chord.beat + 1}`" :aria-current="chord.id === playingChordId ? 'true' : undefined">
        <strong>{{ chord.symbol }}</strong><small>{{ analyzeChord(chord.symbol, keySignature).plainLanguage }}</small>
      </button>
    </div>
    <textarea
      :value="phrase.lyrics"
      :placeholder="phrase.instrumental ? 'Describe the instrumental phrase…' : 'Continue the thought…'"
      :aria-label="`Lyrics for phrase ${phrase.order + 1}`"
      rows="2"
      @input="emit('updateLyrics', ($event.target as HTMLTextAreaElement).value)"
      @keydown="keydown"
    />
    <footer class="phrase-block__toolbar">
      <button
        type="button"
        class="phrase-block__icon-action phrase-block__play-action"
        aria-label="Play phrase"
        :aria-describedby="`${controlId}-play-tooltip`"
        @click.stop="emit('play', false)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12l10-6z" /></svg>
        <span :id="`${controlId}-play-tooltip`" role="tooltip">{{ playing ? 'Playing phrase' : 'Play phrase' }}</span>
      </button>

      <div v-if="active" class="phrase-block__quick-actions" aria-label="Phrase playback and creative actions">
        <button
          type="button"
          class="phrase-block__icon-action"
          aria-label="Play phrase with lead-in"
          :aria-describedby="`${controlId}-lead-in-tooltip`"
          @click.stop="emit('play', true)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 7h-5a6 6 0 1 0 0 12h7M8 7 4 11l4 4" /></svg>
          <span :id="`${controlId}-lead-in-tooltip`" role="tooltip">Play with lead-in</span>
        </button>
        <button
          type="button"
          class="phrase-block__icon-action"
          aria-label="Loop phrase"
          :aria-describedby="`${controlId}-loop-tooltip`"
          @click.stop="emit('loop')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7h-7a5 5 0 0 0-5 5M7 4 4 7l3 3M7 17h7a5 5 0 0 0 5-5M17 20l3-3-3-3" /></svg>
          <span :id="`${controlId}-loop-tooltip`" role="tooltip">Loop phrase</span>
        </button>
        <button
          type="button"
          class="phrase-block__icon-action"
          aria-label="Save phrase alternative"
          :aria-describedby="`${controlId}-alternative-tooltip`"
          @click.stop="emit('alternative')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="7" width="11" height="12" rx="2" /><path d="M9 4h9a2 2 0 0 1 2 2v10" /></svg>
          <span :id="`${controlId}-alternative-tooltip`" role="tooltip">Save alternative</span>
        </button>
        <button
          type="button"
          class="phrase-block__icon-action phrase-block__icon-action--chords"
          aria-label="Chord possibilities"
          :aria-describedby="`${controlId}-chords-tooltip`"
          :aria-expanded="showSuggestions"
          :aria-controls="`${controlId}-suggestions`"
          @click.stop="showSuggestions = !showSuggestions"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6v12M5 9h5V6M10 6v12M14 4v16M14 8h5V5M19 5v12" /><circle cx="20" cy="4" r="1.5" /></svg>
          <span :id="`${controlId}-chords-tooltip`" role="tooltip">Chord possibilities</span>
        </button>
      </div>

      <div class="phrase-block__more" @click.stop>
        <button
          type="button"
          class="phrase-block__icon-action"
          aria-label="More phrase actions"
          :aria-describedby="`${controlId}-more-tooltip`"
          aria-haspopup="menu"
          :aria-expanded="showActionsMenu"
          :aria-controls="`${controlId}-actions-menu`"
          @click="showActionsMenu = !showActionsMenu"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="18" cy="12" r="1.5" /></svg>
          <span :id="`${controlId}-more-tooltip`" role="tooltip">More phrase actions</span>
        </button>
        <div v-if="showActionsMenu" :id="`${controlId}-actions-menu`" class="phrase-block__actions-menu" role="menu" aria-label="Phrase actions">
          <span>Phrase actions</span>
          <button type="button" role="menuitem" @click="emit('move', -1); closeActionsMenu()"><b aria-hidden="true">↑</b> Move earlier</button>
          <button type="button" role="menuitem" @click="emit('move', 1); closeActionsMenu()"><b aria-hidden="true">↓</b> Move later</button>
          <button type="button" role="menuitem" @click="emit('split'); closeActionsMenu()"><b aria-hidden="true">⑂</b> Split phrase</button>
          <button type="button" role="menuitem" @click="emit('merge'); closeActionsMenu()"><b aria-hidden="true">⇥</b> Merge with next</button>
          <button type="button" role="menuitem" class="phrase-block__remove-action" @click="emit('remove'); closeActionsMenu()"><b aria-hidden="true">⌫</b> Remove phrase</button>
        </div>
      </div>
      <span class="phrase-block__shortcut">SHIFT + ENTER · PLAY &amp; NEXT</span>
    </footer>
    <div v-if="showSuggestions" :id="`${controlId}-suggestions`" class="phrase-block__suggestions" @click.stop>
      <p><strong>Requested possibilities</strong><span>Nothing changes until you choose.</span></p>
      <div v-for="suggestion in suggestions" :key="suggestion.symbol" class="phrase-block__suggestion">
        <strong>{{ suggestion.symbol }}</strong><span>{{ suggestion.functionLabel }}</span><small>{{ suggestion.plainLanguage }} · tension {{ suggestion.tension }}%</small>
        <button type="button" :aria-label="`Audition ${suggestion.symbol}`" @click="emit('auditionChord', suggestion.symbol)">▶ Hear</button>
        <button type="button" @click="emit('addChord', suggestion.symbol); showSuggestions = false">Use chord</button>
      </div>
    </div>
  </article>
</template>

<style scoped src="./PhraseBlock.scss" lang="scss" />
