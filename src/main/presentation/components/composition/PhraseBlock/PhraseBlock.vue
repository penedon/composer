<script setup lang="ts">
import { computed, ref } from 'vue'

import { AppButton } from '@presentation/components/base/AppButton'
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
const lastChord = computed(() => props.phrase.chords.at(-1)?.symbol ?? '')
const suggestions = computed(() => suggestNextChords(lastChord.value, props.keySignature).slice(0, 5))

function keydown(event: KeyboardEvent): void {
  if (event.shiftKey && event.key === 'Enter') {
    event.preventDefault()
    emit('playNext')
  }
}
</script>

<template>
  <article class="phrase-block" :class="{ 'phrase-block--active': active, 'phrase-block--playing': playing }" :style="{ '--emotion-color': emotionColor }" @click="emit('select')">
    <header><span>PHRASE {{ phrase.order + 1 }} · {{ phrase.bars }} BARS</span><span>{{ emotionName }}</span></header>
    <div class="phrase-block__chords" aria-label="Chord events">
      <button v-for="chord in phrase.chords" :key="chord.id" type="button" :style="{ left: `${Math.min(88, (chord.beat / (phrase.bars * 4)) * 100)}%` }" :aria-label="`${chord.symbol}, beat ${chord.beat + 1}`">
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
    <footer>
      <AppButton variant="primary" @click.stop="emit('play', false)">{{ playing ? 'Playing…' : '▶ Play phrase' }}</AppButton>
      <AppButton @click.stop="emit('play', true)">↩ With lead-in</AppButton>
      <AppButton @click.stop="emit('loop')">Loop</AppButton>
      <AppButton @click.stop="emit('alternative')">Alternative</AppButton>
      <AppButton variant="ghost" aria-label="Move phrase earlier" @click.stop="emit('move', -1)">↑</AppButton>
      <AppButton variant="ghost" aria-label="Move phrase later" @click.stop="emit('move', 1)">↓</AppButton>
      <AppButton variant="ghost" @click.stop="emit('split')">Split</AppButton>
      <AppButton variant="ghost" @click.stop="emit('merge')">Merge next</AppButton>
      <AppButton variant="ghost" @click.stop="emit('remove')">Remove</AppButton>
      <AppButton @click.stop="showSuggestions = !showSuggestions">Chord possibilities</AppButton>
      <span>SHIFT + ENTER · PLAY &amp; NEXT</span>
    </footer>
    <div v-if="showSuggestions" class="phrase-block__suggestions" @click.stop>
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
