<script setup lang="ts">
import ProjectBar from '@presentation/components/shell/ProjectBar/ProjectBar.vue'
import TransportBar from '@presentation/components/shell/TransportBar/TransportBar.vue'
</script>

<template>
  <div class="app-root">
    <ProjectBar />
    <RouterView />
    <TransportBar />
  </div>
</template>

<style scoped src="./App.scss" lang="scss" />
