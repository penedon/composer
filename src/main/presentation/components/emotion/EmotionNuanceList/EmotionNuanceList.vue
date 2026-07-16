<script setup lang="ts">
import { computed } from 'vue'

import { emotionFamilyPresentation, emotionsForFamily } from '@domain/emotion/emotionTaxonomy'
import type { EmotionFamily } from '@domain/project/project.types'

const props = withDefaults(defineProps<{
  family: EmotionFamily
  modelValue: string | null
  unavailableEmotionIds?: string[]
}>(), { unavailableEmotionIds: () => [] })

const emit = defineEmits<{ 'update:modelValue': [emotionId: string] }>()

const options = computed(() => emotionsForFamily(props.family))
const core = computed(() => options.value.filter((option) => option.kind === 'core'))
const blends = computed(() => options.value.filter((option) => option.kind === 'blend'))
const familyLabel = computed(() => emotionFamilyPresentation.find((item) => item.id === props.family)?.label ?? props.family)

function unavailable(emotionId: string): boolean {
  return props.unavailableEmotionIds.includes(emotionId)
}
</script>

<template>
  <div class="emotion-nuance-list" role="radiogroup" :aria-label="`Shades of ${familyLabel}`">
    <p class="emotion-nuance-list__heading">Core shades</p>
    <div class="emotion-nuance-list__group">
      <button
        v-for="option in core"
        :key="option.emotion.id"
        type="button"
        role="radio"
        class="emotion-nuance-list__option"
        :class="{ 'emotion-nuance-list__option--selected': option.emotion.id === modelValue }"
        :aria-checked="option.emotion.id === modelValue"
        :disabled="unavailable(option.emotion.id)"
        @click="emit('update:modelValue', option.emotion.id)"
      >
        <span class="emotion-nuance-list__dot" :style="{ background: option.emotion.color }" />
        <span><strong>{{ option.emotion.name }}</strong><small>{{ option.familySummary }}</small></span>
        <span v-if="unavailable(option.emotion.id)" class="emotion-nuance-list__status">Already featured</span>
        <span v-else-if="option.emotion.id === modelValue" class="emotion-nuance-list__check" aria-hidden="true">✓</span>
        <span v-else class="emotion-nuance-list__status">Core</span>
      </button>
    </div>

    <p v-if="blends.length" class="emotion-nuance-list__heading">Blended shades</p>
    <div v-if="blends.length" class="emotion-nuance-list__group emotion-nuance-list__group--blends">
      <button
        v-for="option in blends"
        :key="option.emotion.id"
        type="button"
        role="radio"
        class="emotion-nuance-list__option"
        :class="{ 'emotion-nuance-list__option--selected': option.emotion.id === modelValue }"
        :aria-checked="option.emotion.id === modelValue"
        :disabled="unavailable(option.emotion.id)"
        @click="emit('update:modelValue', option.emotion.id)"
      >
        <span class="emotion-nuance-list__dot" :style="{ background: option.emotion.color }" />
        <span><strong>{{ option.emotion.name }}</strong><small>{{ option.familySummary }}</small></span>
        <span v-if="unavailable(option.emotion.id)" class="emotion-nuance-list__status">Already featured</span>
        <span v-else-if="option.emotion.id === modelValue" class="emotion-nuance-list__check" aria-hidden="true">✓</span>
        <span v-else class="emotion-nuance-list__status">Blend</span>
      </button>
    </div>
  </div>
</template>

<style scoped src="./EmotionNuanceList.scss" lang="scss" />
