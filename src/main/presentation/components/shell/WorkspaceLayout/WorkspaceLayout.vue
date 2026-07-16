<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

interface ScrollContainer {
  scrollTo(options: { top: number; left: number }): void
}

const route = useRoute()
const main = ref<ScrollContainer | null>(null)
const inspector = ref<ScrollContainer | null>(null)

watch(
  () => route.path,
  async () => {
    await nextTick()
    main.value?.scrollTo({ top: 0, left: 0 })
    inspector.value?.scrollTo({ top: 0, left: 0 })
  },
)
</script>

<template>
  <div class="workspace-layout">
    <aside class="workspace-layout__rail" aria-label="Composition navigation"><slot name="rail" /></aside>
    <main ref="main" class="workspace-layout__main"><slot /></main>
    <aside v-if="$slots.inspector" ref="inspector" class="workspace-layout__inspector" aria-label="Composition context"><slot name="inspector" /></aside>
  </div>
</template>

<style scoped src="./WorkspaceLayout.scss" lang="scss" />
