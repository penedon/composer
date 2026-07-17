<script setup lang="ts">
import { computed } from 'vue'

import {
  emotionFamilies,
  emotionFamilyPresentation,
  emotionPresentation,
  emotionTaxonomy,
  type TaxonomyEmotion,
} from '@domain/emotion/emotionTaxonomy'
import type { EmotionFamily } from '@domain/project/project.types'
import { emotionFamilyAngle, layoutEmotionNodes } from './EmotionSemanticWheel.layout'

interface Point { x: number; y: number }
interface PositionedEmotion { emotion: TaxonomyEmotion; point: Point; angle: number; kind: 'shade' | 'blend' }

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
const emotionEdgeRadius = 286
const connectorLeadRadius = 248
const connectorArcRadius = 222
const connectorAnchorRadius = 212

function point(angle: number, radius: number): Point {
  const radians = angle * Math.PI / 180
  return { x: center + Math.cos(radians) * radius, y: center + Math.sin(radians) * radius }
}

function cssPosition(item: Point): Record<string, string> {
  return { '--semantic-x': `${item.x / 6}%`, '--semantic-y': `${item.y / 6}%` }
}

const familyPoints = computed(() => Object.fromEntries(
  emotionFamilies.map((family) => [family, point(emotionFamilyAngle(family), familyRadius)]),
) as Record<EmotionFamily, Point>)

const positionedEmotions = computed<PositionedEmotion[]>(() => {
  const layout = layoutEmotionNodes(emotionTaxonomy, emotionEdgeRadius)

  return emotionTaxonomy.map((emotion) => {
    const kind = emotionPresentation[emotion.id].kind
    const position = layout.get(emotion.id)
    if (!position) throw new Error(`Emotion wheel layout is missing ${emotion.id}`)
    const angle = position.angle
    return { emotion, kind, angle, point: point(angle, emotionEdgeRadius) }
  })
})

const selectedEmotion = computed(() => emotionTaxonomy.find((emotion) => emotion.id === props.modelValue) ?? null)
const selectedComponents = computed(() => selectedEmotion.value
  ? emotionFamilyPresentation
      .filter((family) => (selectedEmotion.value?.families[family.id] ?? 0) > 0)
      .map((family) => ({ ...family, weight: selectedEmotion.value?.families[family.id] ?? 0 }))
      .sort((left, right) => right.weight - left.weight)
  : [])

function connectorPath(emotion: TaxonomyEmotion, family: EmotionFamily): string {
  const positioned = positionedEmotions.value.find((item) => item.emotion.id === emotion.id)!
  const familyAngle = emotionFamilyAngle(family)
  const delta = ((familyAngle - positioned.angle + 540) % 360) - 180
  const sweep = delta >= 0 ? 1 : 0
  const lead = point(positioned.angle, connectorLeadRadius)
  const arcStart = point(positioned.angle, connectorArcRadius)
  const arcEnd = point(familyAngle, connectorArcRadius)
  const anchor = point(familyAngle, connectorAnchorRadius)

  return [
    `M ${lead.x} ${lead.y}`,
    `L ${arcStart.x} ${arcStart.y}`,
    `A ${connectorArcRadius} ${connectorArcRadius} 0 0 ${sweep} ${arcEnd.x} ${arcEnd.y}`,
    `L ${anchor.x} ${anchor.y}`,
  ].join(' ')
}

function isParentFamily(family: EmotionFamily): boolean {
  return (selectedEmotion.value?.families[family] ?? 0) > 0
}

function familyOpacity(family: EmotionFamily): number {
  if (props.focusedFamily !== null) {
    if (props.focusedFamily === family) return 1
    return isParentFamily(family) ? .72 : .34
  }
  if (selectedEmotion.value !== null) return isParentFamily(family) ? 1 : .52
  return 1
}

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
  <div
    class="emotion-semantic-wheel"
    role="group"
    aria-label="Semantic emotion map"
  >
    <svg
      viewBox="0 0 600 600"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="300"
        cy="300"
        r="266"
        class="emotion-semantic-wheel__guide emotion-semantic-wheel__guide--outer"
      />
      <circle
        cx="300"
        cy="300"
        r="208"
        class="emotion-semantic-wheel__guide"
      />

      <g class="emotion-semantic-wheel__connections">
        <template
          v-for="emotion in emotionTaxonomy"
          :key="emotion.id"
        >
          <path
            v-for="family in emotionFamilies.filter((item) => (emotion.families[item] ?? 0) > 0)"
            :key="`${emotion.id}-${family}`"
            :d="connectorPath(emotion, family)"
            :stroke="emotionFamilyPresentation.find((item) => item.id === family)?.color"
            fill="none"
            class="emotion-semantic-wheel__connection"
            data-layout-zone="edge"
            :data-connection-emotion-id="emotion.id"
            :data-connection-family="family"
            :data-min-radius="connectorAnchorRadius"
            :data-max-radius="connectorLeadRadius"
            :class="{
              'emotion-semantic-wheel__connection--selected': emotion.id === modelValue,
              'emotion-semantic-wheel__connection--focused': focusedFamily === family,
              'emotion-semantic-wheel__connection--muted': modelValue !== null && emotion.id !== modelValue,
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
        class="emotion-semantic-wheel__family-sector"
        :class="{ 'emotion-semantic-wheel__family-sector--parent': isParentFamily(family.id) }"
        :stroke="family.color"
        stroke-width="58"
        stroke-dasharray="11.2 88.8"
        :opacity="familyOpacity(family.id)"
        :transform="`rotate(${index * 45 - 112.5} 300 300)`"
        :data-family-id="family.id"
        :data-parent-highlighted="isParentFamily(family.id) ? '' : undefined"
      />
    </svg>

    <div
      class="emotion-semantic-wheel__families"
      aria-label="Filter by emotion family"
    >
      <button
        v-for="family in emotionFamilyPresentation"
        :key="family.id"
        type="button"
        class="emotion-semantic-wheel__family"
        :class="{
          'emotion-semantic-wheel__family--focused': family.id === focusedFamily,
          'emotion-semantic-wheel__family--parent': isParentFamily(family.id),
        }"
        :style="{ ...cssPosition(familyPoints[family.id]), '--family-color': family.color }"
        :aria-pressed="family.id === focusedFamily"
        :data-parent-highlighted="isParentFamily(family.id) ? '' : undefined"
        :aria-label="`${family.label}: ${family.shortDescription}. ${family.id === focusedFamily ? 'Clear filter' : 'Show related emotions'}`"
        @click="chooseFamily(family.id)"
      >
        {{ family.label }}
      </button>
    </div>

    <div
      class="emotion-semantic-wheel__emotions"
      role="radiogroup"
      aria-label="Emotions"
    >
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
        :data-layout-radius="emotionEdgeRadius"
        data-layout-zone="edge"
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

    <div
      v-if="selectedEmotion"
      class="emotion-semantic-wheel__center"
      :data-selected-emotion-id="selectedEmotion.id"
      role="status"
      aria-live="polite"
    >
      <div class="emotion-semantic-wheel__center-title">
        <span
          class="emotion-semantic-wheel__center-dot"
          :style="{ background: selectedEmotion.color }"
        />
        <strong>{{ selectedEmotion.name }}</strong>
      </div>
      <small class="emotion-semantic-wheel__center-description">
        {{ emotionPresentation[selectedEmotion.id].description }}
      </small>
      <div class="emotion-semantic-wheel__center-makeup">
        <p>Emotional makeup</p>
        <div
          v-for="component in selectedComponents"
          :key="component.id"
          class="emotion-semantic-wheel__center-component"
        >
          <span>
            <strong>{{ component.label }}</strong>
            <small>{{ Math.round(component.weight * 100) }}%</small>
          </span>
          <i>
            <b :style="{ width: `${component.weight * 100}%`, background: component.color }" />
          </i>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./EmotionSemanticWheel.scss" lang="scss" />
