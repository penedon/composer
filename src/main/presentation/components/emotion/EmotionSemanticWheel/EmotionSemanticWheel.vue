<script setup lang="ts">
import { computed } from 'vue'

import {
  emotionFamilies,
  emotionFamilyPresentation,
  emotionPresentation,
  emotionTaxonomy,
  primaryEmotionFamily,
  type EmotionId,
  type TaxonomyEmotion,
} from '@domain/emotion/emotionTaxonomy'
import type { EmotionFamily } from '@domain/project/project.types'

interface Point { x: number; y: number }
interface PositionedEmotion { emotion: TaxonomyEmotion; point: Point; kind: 'shade' | 'blend' }

const props = withDefaults(defineProps<{
  modelValue: string | null
  focusedFamily: EmotionFamily | null
  unavailableEmotionIds?: string[]
}>(), { unavailableEmotionIds: () => [] })

const emit = defineEmits<{
  'update:modelValue': [emotionId: string]
  'update:focusedFamily': [family: EmotionFamily | null]
}>()

const center = 300
const familyRadius = 178
const shadeRadius = 260

const blendLayout: Record<EmotionId, { angle: number; radius: number } | undefined> = {
  serenity: undefined,
  delight: undefined,
  devotion: undefined,
  tenderness: undefined,
  longing: { angle: -55, radius: 104 },
  melancholy: undefined,
  grief: undefined,
  despair: undefined,
  apprehension: undefined,
  terror: undefined,
  irritation: undefined,
  rage: undefined,
  contempt: { angle: 112, radius: 130 },
  alienation: { angle: 158, radius: 124 },
  amazement: undefined,
  confusion: undefined,
  yearning: { angle: -151, radius: 132 },
  anticipation: { angle: -119, radius: 126 },
}

function angleForFamily(family: EmotionFamily): number {
  return emotionFamilies.indexOf(family) * 45 - 90
}

function point(angle: number, radius: number): Point {
  const radians = angle * Math.PI / 180
  return { x: center + Math.cos(radians) * radius, y: center + Math.sin(radians) * radius }
}

function cssPosition(item: Point): Record<string, string> {
  return { '--semantic-x': `${item.x / 6}%`, '--semantic-y': `${item.y / 6}%` }
}

const familyPoints = computed(() => Object.fromEntries(
  emotionFamilies.map((family) => [family, point(angleForFamily(family), familyRadius)]),
) as Record<EmotionFamily, Point>)

const positionedEmotions = computed<PositionedEmotion[]>(() => {
  const shadesByFamily = new Map<EmotionFamily, TaxonomyEmotion[]>()
  for (const family of emotionFamilies) shadesByFamily.set(family, [])
  for (const emotion of emotionTaxonomy) {
    if (emotionPresentation[emotion.id].kind === 'shade') shadesByFamily.get(primaryEmotionFamily(emotion))?.push(emotion)
  }

  return emotionTaxonomy.map((emotion) => {
    const kind = emotionPresentation[emotion.id].kind
    if (kind === 'blend') {
      const layout = blendLayout[emotion.id]!
      return { emotion, kind, point: point(layout.angle, layout.radius) }
    }

    const family = primaryEmotionFamily(emotion)
    const siblings = shadesByFamily.get(family) ?? []
    const index = siblings.findIndex((item) => item.id === emotion.id)
    const spread = siblings.length === 2 ? 18 : 10
    const offset = (index - (siblings.length - 1) / 2) * spread
    return { emotion, kind, point: point(angleForFamily(family) + offset, shadeRadius) }
  })
})

const emotionPoints = computed(() => Object.fromEntries(
  positionedEmotions.value.map((item) => [item.emotion.id, item.point]),
) as Record<EmotionId, Point>)

const blends = computed(() => emotionTaxonomy.filter((emotion) => emotionPresentation[emotion.id].kind === 'blend'))

function isUnavailable(emotionId: string): boolean {
  return props.unavailableEmotionIds.includes(emotionId)
}

function isDimmed(emotion: TaxonomyEmotion): boolean {
  return props.focusedFamily !== null && (emotion.families[props.focusedFamily] ?? 0) === 0 && emotion.id !== props.modelValue
}

function chooseEmotion(emotion: TaxonomyEmotion): void {
  if (isUnavailable(emotion.id)) return
  emit('update:modelValue', emotion.id)
}

function chooseFamily(family: EmotionFamily): void {
  emit('update:focusedFamily', props.focusedFamily === family ? null : family)
}

function moveEmotion(event: KeyboardEvent, index: number): void {
  const delta = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0
  if (!delta && event.key !== 'Home' && event.key !== 'End') return
  event.preventDefault()

  const available = positionedEmotions.value.filter((item) => !isUnavailable(item.emotion.id))
  const currentId = positionedEmotions.value[index]?.emotion.id
  const currentIndex = available.findIndex((item) => item.emotion.id === currentId)
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? available.length - 1
      : (currentIndex + delta + available.length) % available.length
  const next = available[nextIndex]
  if (!next) return
  emit('update:modelValue', next.emotion.id)
  const group = (event.currentTarget as HTMLButtonElement).closest('[role="radiogroup"]')
  group?.querySelector<HTMLButtonElement>(`[data-emotion-id="${next.emotion.id}"]`)?.focus()
}
</script>

<template>
  <div class="emotion-semantic-wheel" role="group" aria-label="Semantic emotion map">
    <svg viewBox="0 0 600 600" aria-hidden="true" focusable="false">
      <circle cx="300" cy="300" r="266" class="emotion-semantic-wheel__guide emotion-semantic-wheel__guide--outer" />
      <circle cx="300" cy="300" r="208" class="emotion-semantic-wheel__guide" />
      <circle cx="300" cy="300" r="145" class="emotion-semantic-wheel__guide" />

      <g class="emotion-semantic-wheel__connections">
        <template v-for="blend in blends" :key="blend.id">
          <line
            v-for="family in emotionFamilies.filter((item) => (blend.families[item] ?? 0) > 0)"
            :key="`${blend.id}-${family}`"
            :x1="emotionPoints[blend.id].x"
            :y1="emotionPoints[blend.id].y"
            :x2="familyPoints[family].x"
            :y2="familyPoints[family].y"
            :stroke="emotionFamilyPresentation.find((item) => item.id === family)?.color"
            :class="{
              'emotion-semantic-wheel__connection--selected': blend.id === modelValue,
              'emotion-semantic-wheel__connection--focused': focusedFamily === family,
            }"
          />
        </template>
      </g>

      <circle
        v-for="(family, index) in emotionFamilyPresentation"
        :key="family.id"
        cx="300"
        cy="300"
        r="178"
        pathLength="100"
        fill="none"
        :stroke="family.color"
        stroke-width="58"
        stroke-dasharray="11.2 88.8"
        :opacity="focusedFamily === null || focusedFamily === family.id ? 1 : .42"
        :transform="`rotate(${index * 45 - 112.5} 300 300)`"
      />
      <circle cx="300" cy="300" r="112" class="emotion-semantic-wheel__center" />
    </svg>

    <div class="emotion-semantic-wheel__families" aria-label="Filter by emotion family">
      <button
        v-for="family in emotionFamilyPresentation"
        :key="family.id"
        type="button"
        class="emotion-semantic-wheel__family"
        :class="{ 'emotion-semantic-wheel__family--focused': family.id === focusedFamily }"
        :style="cssPosition(familyPoints[family.id])"
        :aria-pressed="family.id === focusedFamily"
        :aria-label="`${family.label}: ${family.shortDescription}. ${family.id === focusedFamily ? 'Clear filter' : 'Show related emotions'}`"
        @click="chooseFamily(family.id)"
      >
        {{ family.label }}
      </button>
    </div>

    <div class="emotion-semantic-wheel__emotions" role="radiogroup" aria-label="Emotions">
      <button
        v-for="(item, index) in positionedEmotions"
        :key="item.emotion.id"
        type="button"
        role="radio"
        class="emotion-semantic-wheel__emotion"
        :class="{
          'emotion-semantic-wheel__emotion--blend': item.kind === 'blend',
          'emotion-semantic-wheel__emotion--selected': item.emotion.id === modelValue,
          'emotion-semantic-wheel__emotion--dimmed': isDimmed(item.emotion),
        }"
        :style="{ ...cssPosition(item.point), '--emotion-color': item.emotion.color }"
        :aria-checked="item.emotion.id === modelValue"
        :aria-label="`${item.emotion.name}. ${emotionPresentation[item.emotion.id].description}. ${item.kind === 'blend' ? 'Blended emotion' : 'Emotion shade'}`"
        :disabled="isUnavailable(item.emotion.id)"
        :data-emotion-id="item.emotion.id"
        :data-autofocus="item.emotion.id === modelValue ? '' : undefined"
        :tabindex="item.emotion.id === modelValue || (!modelValue && index === 0) ? 0 : -1"
        @click="chooseEmotion(item.emotion)"
        @keydown="moveEmotion($event, index)"
      >
        <span aria-hidden="true" />
        {{ item.emotion.name }}
        <small v-if="isUnavailable(item.emotion.id)">Featured</small>
      </button>
    </div>

    <div class="emotion-semantic-wheel__explanation" aria-hidden="true">
      <strong>{{ modelValue && emotionPresentation[modelValue as EmotionId]?.kind === 'blend' ? 'Blended emotion' : 'Emotion shade' }}</strong>
      <small>{{ focusedFamily ? `Showing ${focusedFamily} connections` : 'Choose a family or emotion' }}</small>
    </div>
  </div>
</template>

<style scoped src="./EmotionSemanticWheel.scss" lang="scss" />
