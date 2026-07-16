<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import AppButton from '@presentation/components/base/AppButton/AppButton.vue'
import EmotionFamilyOrbit from '@presentation/components/emotion/EmotionFamilyOrbit/EmotionFamilyOrbit.vue'
import EmotionNuanceList from '@presentation/components/emotion/EmotionNuanceList/EmotionNuanceList.vue'
import { emotionFamilyPresentation, emotionTaxonomy, primaryEmotionFamily } from '@domain/emotion/emotionTaxonomy'
import type { EmotionFamily, FeaturedEmotion } from '@domain/project/project.types'

import type { EmotionPickerMode } from './EmotionPicker.types'

const props = withDefaults(defineProps<{
  mode: EmotionPickerMode
  currentFamily: EmotionFamily
  currentEmotion?: FeaturedEmotion | undefined
  slotNumber?: number | undefined
  unavailableEmotionIds?: string[]
}>(), { unavailableEmotionIds: () => [] })

const emit = defineEmits<{
  cancel: []
  confirmFamily: [family: EmotionFamily]
  confirmEmotion: [emotion: FeaturedEmotion]
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const pendingFamily = ref<EmotionFamily>(props.mode === 'featured' && props.currentEmotion
  ? primaryEmotionFamily(props.currentEmotion, props.currentFamily)
  : props.currentFamily)
const pendingEmotionId = ref<string | null>(props.currentEmotion?.id ?? null)
const pendingEmotion = computed(() => emotionTaxonomy.find((emotion) => emotion.id === pendingEmotionId.value) ?? null)
const selectedFamily = computed(() => emotionFamilyPresentation.find((family) => family.id === pendingFamily.value) ?? emotionFamilyPresentation[0]!)
let returnFocus: { focus: () => void } | null = null

function chooseFamily(family: EmotionFamily): void {
  pendingFamily.value = family
  if (pendingEmotion.value && (pendingEmotion.value.families[family] ?? 0) === 0) pendingEmotionId.value = null
}

function confirm(): void {
  if (props.mode === 'family') emit('confirmFamily', pendingFamily.value)
  else if (pendingEmotion.value) emit('confirmEmotion', pendingEmotion.value)
}

onMounted(async () => {
  returnFocus = document.activeElement as typeof returnFocus
  if (dialog.value && !dialog.value.open) {
    if (typeof dialog.value.showModal === 'function') dialog.value.showModal()
    else dialog.value.setAttribute('open', '')
  }
  await nextTick()
  dialog.value?.querySelector<HTMLButtonElement>('[data-autofocus]')?.focus()
})

onBeforeUnmount(() => {
  if (dialog.value?.open && typeof dialog.value.close === 'function') dialog.value.close()
  else dialog.value?.removeAttribute('open')
  returnFocus?.focus()
})
</script>

<template>
  <dialog ref="dialog" class="emotion-picker" aria-labelledby="emotion-picker-title" aria-describedby="emotion-picker-copy" @cancel.prevent="emit('cancel')">
    <header class="emotion-picker__header">
      <div>
        <p class="eyebrow">{{ mode === 'featured' ? `REPLACE FEATURED EMOTION ${slotNumber}` : 'DOMINANT EMOTION FAMILY' }}</p>
        <h2 id="emotion-picker-title">{{ mode === 'featured' ? 'Choose the feeling behind this song' : 'Choose the song’s emotional center' }}</h2>
        <p id="emotion-picker-copy">{{ mode === 'featured' ? 'Start with a family, then choose the precise shade.' : 'The dominant family gives the emotional arc a stable center.' }}</p>
      </div>
      <button type="button" class="emotion-picker__close" aria-label="Close emotion picker" @click="emit('cancel')">×</button>
    </header>

    <div class="emotion-picker__body" :class="{ 'emotion-picker__body--family': mode === 'family' }">
      <section class="emotion-picker__families" aria-labelledby="emotion-family-heading">
        <div class="emotion-picker__section-heading">
          <span id="emotion-family-heading">1 · Choose a family</span>
          <small>Arrow keys move around the orbit</small>
        </div>
        <EmotionFamilyOrbit :model-value="pendingFamily" @update:model-value="chooseFamily" />
      </section>

      <section v-if="mode === 'featured'" class="emotion-picker__nuances" aria-labelledby="emotion-nuance-heading">
        <div class="emotion-picker__section-heading">
          <span id="emotion-nuance-heading">2 · Choose a shade of {{ selectedFamily.label }}</span>
          <small>Core family first · blends below</small>
        </div>
        <EmotionNuanceList v-model="pendingEmotionId" :family="pendingFamily" :unavailable-emotion-ids="unavailableEmotionIds" />
      </section>
    </div>

    <footer class="emotion-picker__footer">
      <div class="emotion-picker__preview">
        <span :style="{ background: pendingEmotion?.color ?? selectedFamily.color }" />
        <div>
          <strong>{{ pendingEmotion?.name ?? selectedFamily.label }}</strong>
          <small>{{ pendingEmotion ? `${selectedFamily.label} family · pending selection` : selectedFamily.shortDescription }}</small>
        </div>
      </div>
      <div class="emotion-picker__actions">
        <AppButton variant="secondary" @click="emit('cancel')">Cancel</AppButton>
        <AppButton variant="primary" :disabled="mode === 'featured' && !pendingEmotion" @click="confirm">
          {{ mode === 'featured' ? 'Use emotion' : 'Use family' }}
        </AppButton>
      </div>
    </footer>
  </dialog>
</template>

<style scoped src="./EmotionPicker.scss" lang="scss" />
