<script setup lang="ts">
import { AppButton } from '@presentation/components/base/AppButton'
import { useProjectStore } from '@presentation/stores/project.store'
import { addSection, createSectionVariation, moveSection, removeSection, updateSection } from '@domain/project/project.operations'

const store = useProjectStore()
</script>

<template>
  <section v-if="store.project" class="structure-workspace">
    <p class="eyebrow">SONG STRUCTURE</p><h1 class="page-heading">Arrange the emotional journey.</h1>
    <p class="page-copy">This structure began as a template, but every section remains movable and editable. Variations keep a visible relationship to their source.</p>
    <div class="structure-workspace__templates" aria-label="Structure templates">
      <button aria-pressed="true"><strong>Story arc</strong><small>Intro · Verse · Pre · Chorus · Verse · Bridge · Final</small></button>
      <button><strong>Direct pop</strong><small>Verse · Chorus · Verse · Chorus · Bridge · Chorus</small></button>
      <button><strong>Build manually</strong><small>Start with an empty arrangement</small></button>
    </div>
    <ol class="structure-workspace__sections">
      <li v-for="(section, index) in store.project.sections" :key="section.id" :style="{ '--section-color': section.color }" @click="store.selectedSectionId = section.id">
        <span class="structure-workspace__index">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="structure-workspace__color" />
        <div class="structure-workspace__fields"><input :value="section.name" :aria-label="`${section.name} name`" @change="store.mutate('Rename section', (project) => updateSection(project, section.id, { name: ($event.target as HTMLInputElement).value }))" /><label><span class="sr-only">Bars in {{ section.name }}</span><input type="number" min="1" max="64" :value="section.bars" @change="store.mutate('Resize section', (project) => updateSection(project, section.id, { bars: Number(($event.target as HTMLInputElement).value) }))" /></label><input :value="section.narrativePurpose" :aria-label="`${section.name} narrative purpose`" @change="store.mutate('Update section intention', (project) => updateSection(project, section.id, { narrativePurpose: ($event.target as HTMLInputElement).value }))" /><em v-if="section.sourceSectionId">Variation of {{ store.project.sections.find((item) => item.id === section.sourceSectionId)?.name }}</em></div>
        <div class="structure-workspace__actions">
          <AppButton variant="ghost" :disabled="index === 0" :aria-label="`Move ${section.name} earlier`" @click.stop="store.mutate('Move section earlier', (project) => moveSection(project, section.id, -1))">↑</AppButton>
          <AppButton variant="ghost" :disabled="index === store.project.sections.length - 1" :aria-label="`Move ${section.name} later`" @click.stop="store.mutate('Move section later', (project) => moveSection(project, section.id, 1))">↓</AppButton>
          <AppButton variant="ghost" @click.stop="store.mutate('Create section variation', (project) => createSectionVariation(project, section.id))">Vary</AppButton>
          <AppButton variant="ghost" :disabled="store.project.sections.length <= 1" @click.stop="store.mutate('Remove section', (project) => removeSection(project, section.id))">Remove</AppButton>
        </div>
      </li>
    </ol>
    <AppButton variant="primary" @click="store.mutate('Add section', addSection)">+ Add section</AppButton>
  </section>
</template>

<style scoped src="./StructureWorkspace.scss" lang="scss" />
