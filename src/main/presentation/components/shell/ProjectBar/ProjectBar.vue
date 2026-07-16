<script setup lang="ts">
import { AppButton } from '@presentation/components/base/AppButton'
import { useProjectStore } from '@presentation/stores/project.store'

const store = useProjectStore()
</script>

<template>
  <header class="project-bar">
    <RouterLink class="project-bar__brand" to="/projects"><span aria-hidden="true" />Composer</RouterLink>
    <div class="project-bar__project"><small>PROJECT</small><strong>{{ store.project?.title ?? 'No project' }}</strong></div>
    <div class="project-bar__actions">
      <AppButton variant="ghost" :disabled="!store.canUndo" aria-label="Undo" @click="store.undo"><template #icon><span aria-hidden="true">↶</span></template><span class="project-bar__action-label">Undo</span></AppButton>
      <AppButton variant="ghost" :disabled="!store.canRedo" aria-label="Redo" @click="store.redo"><template #icon><span aria-hidden="true">↷</span></template><span class="project-bar__action-label">Redo</span></AppButton>
      <span class="project-bar__status" role="status">{{ store.saving ? 'Saving…' : 'Saved locally' }}</span>
    </div>
  </header>
</template>

<style scoped src="./ProjectBar.scss" lang="scss" />
