<script setup lang="ts">
import EmotionCurve from '@presentation/components/emotion/EmotionCurve/EmotionCurve.vue'
import { useProjectStore } from '@presentation/stores/project.store'
import { emotionFamilies, emotionTaxonomy } from '@domain/emotion/emotionTaxonomy'
import { replaceFeaturedEmotion, setDominantEmotionFamily, updateEmotionPoint } from '@domain/project/project.operations'

const store = useProjectStore()
</script>

<template>
  <section v-if="store.project" class="emotion-workspace">
    <p class="eyebrow">EMOTIONAL ARC</p><h1 class="page-heading">Shape what the listener feels over time.</h1>
    <p class="page-copy">One dominant family gives the song a center. Three featured emotions can rise, overlap, and contradict each other through the structure.</p>
    <label class="field emotion-workspace__dominant"><span>Dominant emotion family</span><select :value="store.project.emotionPlan.dominantFamily" @change="store.mutate('Change dominant emotion family', (project) => setDominantEmotionFamily(project, ($event.target as HTMLSelectElement).value as typeof project.emotionPlan.dominantFamily))"><option v-for="family in emotionFamilies" :key="family">{{ family }}</option></select></label>
    <div class="emotion-workspace__palette">
      <article v-for="(emotion, index) in store.project.emotionPlan.featured" :key="`${index}-${emotion.id}`" :style="{ '--emotion-color': emotion.color }">
        <span /> <div><strong>{{ emotion.name }}</strong><small>{{ Object.keys(emotion.families).join(' · ') }}</small></div>
        <label><span class="sr-only">Featured emotion {{ index + 1 }}</span><select :value="emotion.id" @change="store.mutate('Change featured emotion', (project) => replaceFeaturedEmotion(project, index, emotionTaxonomy.find((item) => item.id === ($event.target as HTMLSelectElement).value) ?? emotion))"><option v-for="candidate in emotionTaxonomy" :key="candidate.id" :value="candidate.id" :disabled="store.project.emotionPlan.featured.some((item, itemIndex) => itemIndex !== index && item.id === candidate.id)">{{ candidate.name }}</option></select></label>
      </article>
    </div>
    <EmotionCurve
      :sections="store.project.sections"
      :emotions="store.project.emotionPlan.featured"
      :points="store.project.emotionPlan.points"
      @update="(sectionId, emotionId, value) => store.mutate('Shape emotional arc', (project) => updateEmotionPoint(project, sectionId, emotionId, value))"
    />
    <aside class="emotion-workspace__reading paper"><strong>Current reading</strong><p>Longing leads the chorus, while despair overtakes it near the ending. This interpretation guides possibilities; it does not impose harmony.</p></aside>
  </section>
</template>

<style scoped src="./EmotionWorkspace.scss" lang="scss" />
