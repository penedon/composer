<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { phases, type Phase } from '@presentation/router/router'
import { useProjectStore } from '@presentation/stores/project.store'

const labels: Record<Phase, string> = { story: 'Story', frame: 'Frame', emotions: 'Emotions', structure: 'Structure', compose: 'Compose', arrange: 'Arrange', export: 'Export' }
const route = useRoute()
const store = useProjectStore()
const current = computed(() => String(route.params.phase))
</script>

<template>
  <nav class="phase-rail" aria-label="Composition phases">
    <p class="phase-rail__eyebrow">CREATE</p>
    <RouterLink
      v-for="(phase, index) in phases"
      :key="phase"
      class="phase-rail__link"
      :class="{ 'phase-rail__link--active': current === phase }"
      :to="`/projects/${store.project?.id ?? route.params.projectId}/${phase}`"
    >
      <span>{{ index + 1 }}</span>{{ labels[phase] }}
    </RouterLink>
    <div v-if="store.project" class="phase-rail__compass">
      <p class="phase-rail__eyebrow">CREATIVE COMPASS</p>
      <strong>{{ store.project.emotionPlan.dominantFamily }}</strong>
      <small>{{ store.project.emotionPlan.featured.map((item) => item.name).join(' · ') }}</small>
    </div>
  </nav>
</template>

<style scoped src="./PhaseRail.scss" lang="scss" />
