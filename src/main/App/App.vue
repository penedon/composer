<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ProjectBar from '@presentation/components/shell/ProjectBar/ProjectBar.vue'
import TransportBar from '@presentation/components/shell/TransportBar/TransportBar.vue'

const route = useRoute()
const inWorkspace = computed(() => route.name === 'workspace')
</script>

<template>
  <div class="app-root" :class="{ 'app-root--workspace': inWorkspace }">
    <ProjectBar />
    <RouterView />
    <TransportBar />
  </div>
</template>

<style scoped src="./App.scss" lang="scss" />
