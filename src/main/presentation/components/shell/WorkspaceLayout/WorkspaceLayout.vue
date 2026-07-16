<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

interface ScrollContainer {
  scrollTo(options: { top: number; left: number }): void
}

const LEFT_COLLAPSED_KEY = 'composer:shell:left-collapsed'
const INSPECTOR_VISIBLE_KEY = 'composer:shell:inspector-visible'

const route = useRoute()
const main = ref<ScrollContainer | null>(null)
const inspector = ref<ScrollContainer | null>(null)
const leftCollapsed = ref(localStorage.getItem(LEFT_COLLAPSED_KEY) === 'true')
const inspectorVisible = ref(localStorage.getItem(INSPECTOR_VISIBLE_KEY) !== 'false')
const mobileInspectorOpen = ref(false)

function toggleLeft(): void {
  leftCollapsed.value = !leftCollapsed.value
  localStorage.setItem(LEFT_COLLAPSED_KEY, String(leftCollapsed.value))
}

function toggleInspector(): void {
  inspectorVisible.value = !inspectorVisible.value
  localStorage.setItem(INSPECTOR_VISIBLE_KEY, String(inspectorVisible.value))
}

function openMobileInspector(): void {
  mobileInspectorOpen.value = true
}

function closeMobileInspector(): void {
  mobileInspectorOpen.value = false
}

watch(
  () => route.path,
  async () => {
    closeMobileInspector()
    await nextTick()
    main.value?.scrollTo({ top: 0, left: 0 })
    inspector.value?.scrollTo({ top: 0, left: 0 })
  },
)
</script>

<template>
  <div
    class="workspace-layout"
    :class="{
      'workspace-layout--rail-collapsed': leftCollapsed,
      'workspace-layout--inspector-hidden': !inspectorVisible,
    }"
    @keydown.esc="closeMobileInspector"
  >
    <aside id="composition-navigation" class="workspace-layout__rail" aria-label="Composition navigation">
      <slot name="rail" :collapsed="leftCollapsed" />
      <button
        class="workspace-layout__edge-toggle workspace-layout__edge-toggle--rail"
        type="button"
        :aria-expanded="!leftCollapsed"
        aria-controls="composition-navigation"
        :aria-label="leftCollapsed ? 'Expand composition navigation' : 'Contract composition navigation'"
        :title="leftCollapsed ? 'Expand navigation' : 'Contract navigation'"
        @click="toggleLeft"
      >
        <span aria-hidden="true">{{ leftCollapsed ? '›' : '‹' }}</span>
      </button>
    </aside>

    <main ref="main" class="workspace-layout__main"><slot /></main>

    <button
      v-if="$slots.inspector"
      class="workspace-layout__mobile-inspector-trigger"
      type="button"
      aria-controls="composition-inspector"
      :aria-expanded="mobileInspectorOpen"
      @click="openMobileInspector"
    >Context</button>

    <button
      v-if="$slots.inspector && mobileInspectorOpen"
      class="workspace-layout__mobile-scrim"
      type="button"
      aria-label="Close composition context"
      @click="closeMobileInspector"
    />

    <aside
      v-if="$slots.inspector"
      id="composition-inspector"
      ref="inspector"
      class="workspace-layout__inspector"
      :class="{ 'workspace-layout__inspector--mobile-open': mobileInspectorOpen }"
      aria-label="Composition context"
    >
      <div class="workspace-layout__mobile-sheet-heading"><span aria-hidden="true" /><strong>Context</strong><button type="button" @click="closeMobileInspector">Close</button></div>
      <slot name="inspector" />
      <button
        class="workspace-layout__edge-toggle workspace-layout__edge-toggle--inspector"
        type="button"
        aria-expanded="true"
        aria-controls="composition-inspector"
        aria-label="Hide composition context"
        title="Hide context"
        @click="toggleInspector"
      >
        <span aria-hidden="true">›</span>
      </button>
    </aside>

    <button
      v-if="$slots.inspector && !inspectorVisible"
      class="workspace-layout__inspector-restore"
      type="button"
      aria-expanded="false"
      aria-controls="composition-inspector"
      aria-label="Show composition context"
      title="Show context"
      @click="toggleInspector"
    >
      <span aria-hidden="true">‹</span>
    </button>
  </div>
</template>

<style scoped src="./WorkspaceLayout.scss" lang="scss" />
