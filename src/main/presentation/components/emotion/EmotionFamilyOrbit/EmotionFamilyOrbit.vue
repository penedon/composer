<script setup lang="ts">
import { computed } from 'vue'

import { emotionFamilyPresentation } from '@domain/emotion/emotionTaxonomy'
import type { EmotionFamily } from '@domain/project/project.types'

const props = defineProps<{ modelValue: EmotionFamily }>()
const emit = defineEmits<{ 'update:modelValue': [family: EmotionFamily] }>()

const selected = computed(() => emotionFamilyPresentation.find((family) => family.id === props.modelValue) ?? emotionFamilyPresentation[0]!)

function position(index: number): Record<string, string> {
  const angle = (index * 45 - 90) * Math.PI / 180
  return {
    '--orbit-x': `${Math.cos(angle) * 8.4}rem`,
    '--orbit-y': `${Math.sin(angle) * 8.4}rem`,
  }
}

function move(event: KeyboardEvent, index: number): void {
  const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  let next: number
  if (event.key in keys) next = (index + keys[event.key]! + emotionFamilyPresentation.length) % emotionFamilyPresentation.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = emotionFamilyPresentation.length - 1
  else return

  event.preventDefault()
  const family = emotionFamilyPresentation[next]!
  emit('update:modelValue', family.id)
  const group = (event.currentTarget as HTMLButtonElement).closest('[role="radiogroup"]')
  group?.querySelectorAll<HTMLButtonElement>('.emotion-family-orbit__option')[next]?.focus()
}
</script>

<template>
  <div class="emotion-family-orbit">
    <div class="emotion-family-orbit__control" role="radiogroup" aria-label="Emotion families">
      <svg viewBox="0 0 400 400" aria-hidden="true" focusable="false">
        <circle
          v-for="(family, index) in emotionFamilyPresentation"
          :key="family.id"
          cx="200"
          cy="200"
          r="142"
          pathLength="100"
          fill="none"
          :stroke="family.color"
          stroke-width="78"
          stroke-dasharray="11.65 88.35"
          :opacity="family.id === modelValue ? 1 : .72"
          :transform="`rotate(${index * 45 - 111.25} 200 200)`"
        />
        <circle cx="200" cy="200" r="96" fill="var(--surface)" stroke="var(--border-strong)" stroke-width="2" />
      </svg>
      <button
        v-for="(family, index) in emotionFamilyPresentation"
        :key="family.id"
        class="emotion-family-orbit__option"
        :class="{ 'emotion-family-orbit__option--selected': family.id === modelValue }"
        type="button"
        role="radio"
        :aria-checked="family.id === modelValue"
        :aria-label="`${family.label}: ${family.shortDescription}`"
        :tabindex="family.id === modelValue ? 0 : -1"
        :data-autofocus="family.id === modelValue ? '' : undefined"
        :style="position(index)"
        @click="emit('update:modelValue', family.id)"
        @keydown="move($event, index)"
      >
        {{ family.label }}
      </button>
      <div class="emotion-family-orbit__center" aria-hidden="true">
        <span :style="{ background: selected.color }" />
        <strong>{{ selected.label }}</strong>
        <small>{{ selected.shortDescription }}</small>
      </div>
    </div>
  </div>
</template>

<style scoped src="./EmotionFamilyOrbit.scss" lang="scss" />
