<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import AppButton from '@presentation/components/base/AppButton/AppButton.vue'
import EmotionFamilyOrbit from '@presentation/components/emotion/EmotionFamilyOrbit/EmotionFamilyOrbit.vue'
import EmotionNuanceList from '@presentation/components/emotion/EmotionNuanceList/EmotionNuanceList.vue'
import EmotionSemanticWheel from '@presentation/components/emotion/EmotionSemanticWheel/EmotionSemanticWheel.vue'
import {
  emotionFamilyPresentation,
  emotionFamilySummary,
  emotionPresentation,
  emotionTaxonomy,
  primaryEmotionFamily,
} from '@domain/emotion/emotionTaxonomy'
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
const compactFeaturedView = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(max-width: 860px)').matches
const featuredView = ref<'wheel' | 'list'>(compactFeaturedView ? 'list' : 'wheel')
const pendingFamily = ref<EmotionFamily>(props.mode === 'featured' && props.currentEmotion
  ? primaryEmotionFamily(props.currentEmotion, props.currentFamily)
  : props.currentFamily)
const focusedFamily = ref<EmotionFamily | null>(null)
const pendingEmotionId = ref<string | null>(props.currentEmotion?.id ?? null)
const pendingEmotion = computed(() => emotionTaxonomy.find((emotion) => emotion.id === pendingEmotionId.value) ?? null)
const selectedFamily = computed(() => emotionFamilyPresentation.find((family) => family.id === pendingFamily.value) ?? emotionFamilyPresentation[0]!)
const pendingDescription = computed(() => pendingEmotion.value ? emotionPresentation[pendingEmotion.value.id].description : '')
const pendingFamilySummary = computed(() => pendingEmotion.value ? emotionFamilySummary(pendingEmotion.value) : selectedFamily.value.label)
const pendingComponents = computed(() => pendingEmotion.value
  ? emotionFamilyPresentation
      .filter((family) => (pendingEmotion.value?.families[family.id] ?? 0) > 0)
      .map((family) => ({ ...family, weight: pendingEmotion.value?.families[family.id] ?? 0 }))
      .sort((left, right) => right.weight - left.weight)
  : [])
let returnFocus: { focus: () => void } | null = null

function chooseFamily(family: EmotionFamily): void {
  pendingFamily.value = family
  if (pendingEmotion.value && (pendingEmotion.value.families[family] ?? 0) === 0) pendingEmotionId.value = null
}

function focusFamily(family: EmotionFamily | null): void {
  focusedFamily.value = family
  if (family) pendingFamily.value = family
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
        <p id="emotion-picker-copy">{{ mode === 'featured' ? 'Choose a family, a precise shade, or a blended emotion that bridges several families.' : 'The dominant family gives the emotional arc a stable center.' }}</p>
      </div>
      <button type="button" class="emotion-picker__close" aria-label="Close emotion picker" @click="emit('cancel')">×</button>
    </header>

    <div v-if="mode === 'family'" class="emotion-picker__body emotion-picker__body--family">
      <section class="emotion-picker__families" aria-labelledby="emotion-family-heading">
        <div class="emotion-picker__section-heading">
          <span id="emotion-family-heading">Choose a family</span>
          <small>Arrow keys move around the orbit</small>
        </div>
        <EmotionFamilyOrbit :model-value="pendingFamily" @update:model-value="chooseFamily" />
      </section>
    </div>

    <div v-else class="emotion-picker__featured">
      <div class="emotion-picker__view-switch" aria-label="Emotion picker view">
        <button type="button" :aria-pressed="featuredView === 'wheel'" @click="featuredView = 'wheel'">Wheel</button>
        <button type="button" :aria-pressed="featuredView === 'list'" @click="featuredView = 'list'">List</button>
      </div>

      <div v-if="featuredView === 'wheel'" class="emotion-picker__semantic-view">
        <section class="emotion-picker__map" aria-labelledby="emotion-map-heading">
          <div class="emotion-picker__section-heading">
            <span id="emotion-map-heading">Emotion map</span>
            <small>Select a family to highlight its connections</small>
          </div>
          <EmotionSemanticWheel
            v-model="pendingEmotionId"
            :focused-family="focusedFamily"
            :unavailable-emotion-ids="unavailableEmotionIds"
            @update:focused-family="focusFamily"
          />
        </section>

        <aside class="emotion-picker__details" aria-live="polite">
          <p class="emotion-picker__details-label">Selected emotion</p>
          <template v-if="pendingEmotion">
            <div class="emotion-picker__details-card" :style="{ '--emotion-color': pendingEmotion.color }">
              <span />
              <div><strong>{{ pendingEmotion.name }}</strong><small>{{ emotionPresentation[pendingEmotion.id].kind === 'blend' ? 'Blended emotion' : 'Emotion shade' }}</small></div>
              <p>{{ pendingDescription }}</p>
            </div>
            <p class="emotion-picker__details-label">Emotional makeup</p>
            <div class="emotion-picker__makeup">
              <div v-for="component in pendingComponents" :key="component.id">
                <span><strong>{{ component.label }}</strong><small>{{ Math.round(component.weight * 100) }}%</small></span>
                <i><b :style="{ width: `${component.weight * 100}%`, background: component.color }" /></i>
              </div>
            </div>
          </template>
          <div v-else class="emotion-picker__details-empty">
            <strong>Choose an emotion</strong>
            <p>Round nodes are family shades. Diamond nodes bridge two or more families.</p>
          </div>
          <button type="button" class="emotion-picker__list-route" @click="featuredView = 'list'">
            <span><strong>Prefer a linear route?</strong><small>Browse family groups and descriptions.</small></span><b aria-hidden="true">›</b>
          </button>
        </aside>
      </div>

      <div v-else class="emotion-picker__list-view">
        <section class="emotion-picker__families" aria-labelledby="emotion-family-heading">
          <div class="emotion-picker__section-heading">
            <span id="emotion-family-heading">1 · Choose a family</span>
            <small>Arrow keys move around the orbit</small>
          </div>
          <EmotionFamilyOrbit :model-value="pendingFamily" @update:model-value="chooseFamily" />
        </section>
        <section class="emotion-picker__nuances" aria-labelledby="emotion-nuance-heading">
          <div class="emotion-picker__section-heading">
            <span id="emotion-nuance-heading">2 · Choose a shade of {{ selectedFamily.label }}</span>
            <small>Family shades first · blends below</small>
          </div>
          <EmotionNuanceList v-model="pendingEmotionId" :family="pendingFamily" :unavailable-emotion-ids="unavailableEmotionIds" />
        </section>
      </div>
    </div>

    <footer class="emotion-picker__footer">
      <div class="emotion-picker__preview">
        <span :style="{ background: pendingEmotion?.color ?? selectedFamily.color }" />
        <div>
          <strong>{{ pendingEmotion?.name ?? selectedFamily.label }}</strong>
          <small>{{ pendingEmotion ? `${pendingFamilySummary} · pending selection` : selectedFamily.shortDescription }}</small>
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
