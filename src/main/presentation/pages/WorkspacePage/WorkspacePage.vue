<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import PhaseRail from '@presentation/components/shell/PhaseRail/PhaseRail.vue'
import WorkspaceLayout from '@presentation/components/shell/WorkspaceLayout/WorkspaceLayout.vue'
import StoryWorkspace from '@presentation/workspaces/StoryWorkspace/StoryWorkspace.vue'
import FrameWorkspace from '@presentation/workspaces/FrameWorkspace/FrameWorkspace.vue'
import EmotionWorkspace from '@presentation/workspaces/EmotionWorkspace/EmotionWorkspace.vue'
import StructureWorkspace from '@presentation/workspaces/StructureWorkspace/StructureWorkspace.vue'
import ComposeWorkspace from '@presentation/workspaces/ComposeWorkspace/ComposeWorkspace.vue'
import ArrangeWorkspace from '@presentation/workspaces/ArrangeWorkspace/ArrangeWorkspace.vue'
import ExportWorkspace from '@presentation/workspaces/ExportWorkspace/ExportWorkspace.vue'
import { useProjectStore } from '@presentation/stores/project.store'

const route = useRoute()
const store = useProjectStore()
const workspaces = { story: StoryWorkspace, frame: FrameWorkspace, emotions: EmotionWorkspace, structure: StructureWorkspace, compose: ComposeWorkspace, arrange: ArrangeWorkspace, export: ExportWorkspace }
const activeWorkspace = computed(() => workspaces[String(route.params.phase) as keyof typeof workspaces] ?? StoryWorkspace)

async function ensureProject(): Promise<void> {
  const id = String(route.params.projectId)
  if (store.project?.id !== id) await store.load(id)
}

onMounted(ensureProject)
watch(() => route.params.projectId, ensureProject)
</script>

<template>
  <WorkspaceLayout>
    <template #rail><PhaseRail /></template>
    <div v-if="store.loading" class="workspace-loading" role="status">Opening your local project…</div>
    <div v-else-if="store.error" class="workspace-error" role="alert">{{ store.error }}</div>
    <component :is="activeWorkspace" v-else-if="store.project" />
    <template #inspector>
      <section v-if="store.project" class="inspector">
        <p class="eyebrow">PROJECT INTENT</p>
        <h2>{{ store.project.title }}</h2>
        <p>{{ store.project.sections.find((section) => section.id === store.selectedSectionId)?.narrativePurpose ?? 'Select a section to see its intention.' }}</p>
        <hr />
        <p class="eyebrow">FEATURED EMOTIONS</p>
        <ul>
          <li v-for="emotion in store.project.emotionPlan.featured" :key="emotion.id"><span :style="{ background: emotion.color }" />{{ emotion.name }}</li>
        </ul>
        <hr />
        <p class="inspector__note">Suggestions explain possibilities and never change the project until you accept them.</p>
      </section>
    </template>
  </WorkspaceLayout>
</template>

<style scoped src="./WorkspacePage.scss" lang="scss" />
