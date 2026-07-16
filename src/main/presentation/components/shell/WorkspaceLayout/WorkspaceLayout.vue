<template>
  <div class="workspace-layout">
    <aside class="workspace-layout__rail" aria-label="Composition navigation"><slot name="rail" /></aside>
    <main class="workspace-layout__main"><slot /></main>
    <aside v-if="$slots.inspector" class="workspace-layout__inspector" aria-label="Composition context"><slot name="inspector" /></aside>
  </div>
</template>

<style scoped src="./WorkspaceLayout.scss" lang="scss" />
