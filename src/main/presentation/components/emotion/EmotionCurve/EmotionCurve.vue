<script setup lang="ts">
import { computed } from 'vue'

import type { EmotionPoint, FeaturedEmotion, SongSection } from '@domain/project/project.types'

const props = defineProps<{ sections: SongSection[]; emotions: FeaturedEmotion[]; points: EmotionPoint[] }>()
const emit = defineEmits<{ update: [sectionId: string, emotionId: string, intensity: number] }>()

const width = 760
const height = 330
const step = computed(() => props.sections.length > 1 ? width / (props.sections.length - 1) : width)

function intensity(sectionId: string, emotionId: string): number {
  return props.points.find((point) => point.sectionId === sectionId && point.emotionId === emotionId)?.intensity ?? 0
}

function path(emotionId: string): string {
  return props.sections.map((section, index) => `${index === 0 ? 'M' : 'L'} ${index * step.value} ${height - intensity(section.id, emotionId) * 3}`).join(' ')
}
</script>

<template>
  <div class="emotion-curve">
    <svg :viewBox="`-28 -12 ${width + 56} ${height + 64}`" role="img" aria-labelledby="emotion-chart-title emotion-chart-desc">
      <title id="emotion-chart-title">Emotional intensity by song section</title>
      <desc id="emotion-chart-desc">Three labeled emotion curves show intensity from zero to one hundred percent. Sliders below provide keyboard editing.</desc>
      <g class="emotion-curve__grid">
        <line v-for="value in [0, 25, 50, 75, 100]" :key="value" x1="0" :y1="height - value * 3" :x2="width" :y2="height - value * 3" />
        <text v-for="value in [0, 25, 50, 75, 100]" :key="`label-${value}`" x="-10" :y="height - value * 3 + 4" text-anchor="end">{{ value }}</text>
      </g>
      <g v-for="emotion in emotions" :key="emotion.id">
        <path class="emotion-curve__path" :d="path(emotion.id)" :stroke="emotion.color" />
        <circle v-for="(section, index) in sections" :key="section.id" :cx="index * step" :cy="height - intensity(section.id, emotion.id) * 3" r="6" :stroke="emotion.color" />
      </g>
      <text v-for="(section, index) in sections" :key="section.id" :x="index * step" :y="height + 30" text-anchor="middle" class="emotion-curve__section">{{ section.name }}</text>
    </svg>
    <div class="emotion-curve__controls">
      <fieldset v-for="emotion in emotions" :key="emotion.id">
        <legend><span :style="{ background: emotion.color }" />{{ emotion.name }}</legend>
        <label v-for="section in sections" :key="section.id">
          <span>{{ section.name }} <strong>{{ intensity(section.id, emotion.id) }}%</strong></span>
          <input type="range" min="0" max="100" :value="intensity(section.id, emotion.id)" @input="emit('update', section.id, emotion.id, Number(($event.target as HTMLInputElement).value))" />
        </label>
      </fieldset>
    </div>
  </div>
</template>

<style scoped src="./EmotionCurve.scss" lang="scss" />
