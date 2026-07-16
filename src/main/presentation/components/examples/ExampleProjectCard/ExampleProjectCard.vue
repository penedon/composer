<script setup lang="ts">
import { computed } from 'vue'

import type { SongExample } from '@domain/examples/example.types'
import { AppButton } from '@presentation/components/base/AppButton'

const props = withDefaults(defineProps<{ example: SongExample; opening?: boolean }>(), { opening: false })
const emit = defineEmits<{ open: [] }>()
const lyricPhrases = computed(() => props.example.project.phrases.filter((phrase) => !phrase.instrumental).length)
</script>

<template>
  <article class="example-card">
    <div class="example-card__art" aria-hidden="true">
      <span class="example-card__road" />
      <span class="example-card__sun" />
    </div>
    <div class="example-card__content">
      <p class="eyebrow">COMPLETE SONG EXAMPLE</p>
      <h3>{{ example.project.title }}</h3>
      <p class="example-card__theme">{{ example.theme }}</p>
      <p class="example-card__summary">{{ example.summary }}</p>
      <dl>
        <div><dt>Sections</dt><dd>{{ example.project.sections.length }}</dd></div>
        <div><dt>Lyric phrases</dt><dd>{{ lyricPhrases }}</dd></div>
        <div><dt>Tracks</dt><dd>{{ example.project.tracks.length }}</dd></div>
        <div><dt>Tempo</dt><dd>{{ example.project.frame.tempo }} BPM</dd></div>
      </dl>
      <ol class="example-card__steps" aria-label="Completed composition steps">
        <li v-for="(step, index) in example.steps" :key="step"><span>{{ index + 1 }}</span>{{ step }}</li>
      </ol>
      <AppButton variant="primary" :disabled="opening" @click="emit('open')">
        {{ opening ? 'Opening example…' : 'Explore every step' }}
      </AppButton>
    </div>
  </article>
</template>

<style scoped src="./ExampleProjectCard.scss" lang="scss" />
