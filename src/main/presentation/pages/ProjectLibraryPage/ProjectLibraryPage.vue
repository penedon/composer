<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { AppButton } from '@presentation/components/base/AppButton'
import { useProjectStore } from '@presentation/stores/project.store'
import { composerApplication } from '@main/application'
import { songExamples } from '@domain/examples/songExamples'
import type { SongExample } from '@domain/examples/example.types'
import { ExampleProjectCard } from '@presentation/components/examples/ExampleProjectCard'

const store = useProjectStore()
const router = useRouter()
const title = ref('Untitled song')
const fileInput = ref<HTMLInputElement | null>(null)
const openingExampleId = ref<string | null>(null)

onMounted(() => store.refreshLibrary())

async function createProject(): Promise<void> {
  const project = await store.create(title.value.trim() || 'Untitled song')
  await router.push(`/projects/${project.id}/story`)
}

async function importFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const project = await store.importProject(await file.text())
  await router.push(`/projects/${project.id}/story`)
}

async function importNativeFile(): Promise<void> {
  const project = await store.selectNativeProject()
  if (project) await router.push(`/projects/${project.id}/story`)
}

async function openExample(example: SongExample): Promise<void> {
  openingExampleId.value = example.id
  try {
    const project = await store.openExample(example.project)
    await router.push(`/projects/${project.id}/story`)
  } finally {
    openingExampleId.value = null
  }
}
</script>

<template>
  <main class="library">
    <section class="library__hero">
      <p class="eyebrow">LOCAL-FIRST SONGWRITING</p>
      <h1>Turn an emotional story into a playable song.</h1>
      <p>Start with the narrative. Shape the emotional arc. Compose one phrase at a time. Export separate MIDI tracks when the sketch is ready.</p>
      <form class="library__create" @submit.prevent="createProject">
        <label class="field"><span>Project title</span><input v-model="title" aria-label="Project title" /></label>
        <AppButton type="submit" variant="primary">Create project</AppButton>
        <AppButton type="button" @click="fileInput?.click()">Import project</AppButton>
        <AppButton v-if="composerApplication.portable.selectProject" type="button" @click="importNativeFile">Open native file</AppButton>
        <input ref="fileInput" class="sr-only" type="file" accept=".json,.composer.json" @change="importFile" />
      </form>
    </section>

    <section class="library__examples" aria-labelledby="examples-heading">
      <p class="eyebrow">LEARN FROM A FINISHED SONG</p>
      <h2 id="examples-heading">Song examples</h2>
      <p>Open a completed project and move freely through every decision—from story and emotion to chords, tracks, and MIDI export.</p>
      <div class="library__example-grid">
        <ExampleProjectCard
          v-for="example in songExamples"
          :key="example.id"
          :example="example"
          :opening="openingExampleId === example.id"
          @open="openExample(example)"
        />
      </div>
    </section>

    <section class="library__recent" aria-labelledby="recent-heading">
      <p class="eyebrow">YOUR PROJECTS</p>
      <h2 id="recent-heading">Continue composing</h2>
      <div v-if="store.projects.length" class="library__grid">
        <RouterLink v-for="project in store.projects" :key="project.id" class="library__card" :to="`/projects/${project.id}/story`">
          <span class="library__mark" aria-hidden="true" />
          <strong>{{ project.title }}</strong>
          <small>Saved {{ new Date(project.updatedAt).toLocaleString() }}</small>
          <span>Open story →</span>
        </RouterLink>
      </div>
      <p v-else class="library__empty">No local projects yet. Your first song can begin above.</p>
    </section>
  </main>
</template>

<style scoped src="./ProjectLibraryPage.scss" lang="scss" />
