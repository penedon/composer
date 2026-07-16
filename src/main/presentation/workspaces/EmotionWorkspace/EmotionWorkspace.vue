<script setup lang="ts">
import { ref } from 'vue'

import AppButton from '@presentation/components/base/AppButton/AppButton.vue'
import EmotionCurve from '@presentation/components/emotion/EmotionCurve/EmotionCurve.vue'
import EmotionPicker from '@presentation/components/emotion/EmotionPicker/EmotionPicker.vue'
import { useProjectStore } from '@presentation/stores/project.store'
import { replaceFeaturedEmotion, setDominantEmotionFamily, updateEmotionPoint } from '@domain/project/project.operations'
import type { EmotionFamily, FeaturedEmotion } from '@domain/project/project.types'

type PickerState = { mode: 'family' } | { mode: 'featured'; index: number }

const store = useProjectStore()
const picker = ref<PickerState | null>(null)

function unavailableEmotionIds(index: number): string[] {
  return store.project?.emotionPlan.featured.filter((_, itemIndex) => itemIndex !== index).map((emotion) => emotion.id) ?? []
}

function confirmFamily(family: EmotionFamily): void {
  store.mutate('Change dominant emotion family', (project) => setDominantEmotionFamily(project, family))
  picker.value = null
}

function confirmEmotion(emotion: FeaturedEmotion): void {
  if (picker.value?.mode !== 'featured') return
  const index = picker.value.index
  store.mutate('Change featured emotion', (project) => replaceFeaturedEmotion(project, index, emotion))
  picker.value = null
}
</script>

<template>
  <section v-if="store.project" class="emotion-workspace">
    <p class="eyebrow">EMOTIONAL ARC</p>
    <h1 class="page-heading">Shape what the listener feels over time.</h1>
    <p class="page-copy">One dominant family gives the song a center. Three featured emotions can rise, overlap, and contradict each other through the structure.</p>

    <div class="emotion-workspace__dominant field">
      <span>Dominant emotion family</span>
      <button
        type="button"
        class="emotion-workspace__dominant-button"
        aria-haspopup="dialog"
        :aria-label="`Change dominant emotion family, currently ${store.project.emotionPlan.dominantFamily}`"
        @click="picker = { mode: 'family' }"
      >
        <span class="emotion-workspace__family-mark" />
        <strong>{{ store.project.emotionPlan.dominantFamily }}</strong>
        <small>Change</small>
      </button>
    </div>

    <div class="emotion-workspace__palette" aria-label="Featured emotions">
      <article v-for="(emotion, index) in store.project.emotionPlan.featured" :key="`${index}-${emotion.id}`" :style="{ '--emotion-color': emotion.color }">
        <span />
        <div><strong>{{ emotion.name }}</strong><small>{{ Object.keys(emotion.families).join(' · ') }}</small></div>
        <AppButton variant="secondary" :aria-label="`Change ${emotion.name}`" aria-haspopup="dialog" @click="picker = { mode: 'featured', index }">Change</AppButton>
      </article>
    </div>

    <EmotionCurve
      :sections="store.project.sections"
      :emotions="store.project.emotionPlan.featured"
      :points="store.project.emotionPlan.points"
      @update="(sectionId, emotionId, value) => store.mutate('Shape emotional arc', (project) => updateEmotionPoint(project, sectionId, emotionId, value))"
    />
    <aside class="emotion-workspace__reading paper"><strong>Current reading</strong><p>Longing leads the chorus, while despair overtakes it near the ending. This interpretation guides possibilities; it does not impose harmony.</p></aside>

    <EmotionPicker
      v-if="picker"
      :mode="picker.mode"
      :current-family="store.project.emotionPlan.dominantFamily"
      :current-emotion="picker.mode === 'featured' ? store.project.emotionPlan.featured[picker.index] : undefined"
      :slot-number="picker.mode === 'featured' ? picker.index + 1 : undefined"
      :unavailable-emotion-ids="picker.mode === 'featured' ? unavailableEmotionIds(picker.index) : []"
      @cancel="picker = null"
      @confirm-family="confirmFamily"
      @confirm-emotion="confirmEmotion"
    />
  </section>
</template>

<style scoped src="./EmotionWorkspace.scss" lang="scss" />
