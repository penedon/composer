<script setup lang="ts">
import { computed, ref } from 'vue'

import { applyStructureTemplate, addSection, createSectionVariation, moveSection, removeSection, updateSection } from '@domain/project/project.operations'
import { lastAppliedStructureTemplateId, structureTemplateOperationDescription, structureTemplates } from '@domain/structure/structureTemplates'
import { AppButton } from '@presentation/components/base/AppButton'
import { useProjectStore } from '@presentation/stores/project.store'

const store = useProjectStore()
const selectedTemplateId = ref(lastAppliedStructureTemplateId(store.project?.operations ?? []) ?? 'story-arc')
const choosingTemplate = ref(false)
const selectedTemplate = computed(() => structureTemplates.find((template) => template.id === selectedTemplateId.value) ?? structureTemplates[0]!)
const totalTemplateBars = computed(() => selectedTemplate.value.sections.reduce((total, section) => total + section.bars, 0))
const selectedTemplateApplied = computed(() => lastAppliedStructureTemplateId(store.project?.operations ?? []) === selectedTemplate.value.id)

function selectTemplate(templateId: string): void {
  selectedTemplateId.value = templateId
  choosingTemplate.value = false
}

function applySelectedTemplate(): void {
  const project = store.project
  if (!project) return
  const template = selectedTemplate.value
  store.mutate(structureTemplateOperationDescription(template), (current) => applyStructureTemplate(current, template))
  const firstSection = store.project?.sections[0]
  store.selectedSectionId = firstSection?.id ?? ''
  store.selectedPhraseId = store.project?.phrases.find((phrase) => phrase.sectionId === firstSection?.id)?.id ?? null
}
</script>

<template>
  <section v-if="store.project" class="structure-workspace">
    <p class="eyebrow">SONG STRUCTURE</p><h1 class="page-heading">Arrange the emotional journey.</h1>
    <p class="page-copy">Choose a proven form or begin with one blank section. Previewing is safe; a template changes the song only when you apply it, and every section remains editable afterward.</p>
    <section class="structure-workspace__template-selection" aria-label="Selected structure template" aria-live="polite">
      <div class="structure-workspace__template-summary">
        <span class="eyebrow">SELECTED TEMPLATE</span>
        <strong>{{ selectedTemplate.name }}</strong>
        <span>{{ selectedTemplate.description }}</span>
        <span>{{ selectedTemplate.sections.length }} sections · {{ totalTemplateBars }} bars</span>
        <em>Best for {{ selectedTemplate.bestFor.toLocaleLowerCase() }}</em>
        <small v-if="selectedTemplateApplied">Applied to this song. Its sections remain independently editable.</small>
        <small v-else>Applying preserves all {{ store.project.phrases.length }} existing phrases and projects the emotional curve onto the new form.</small>
      </div>
      <div class="structure-workspace__template-actions">
        <AppButton variant="ghost" aria-controls="structure-template-options" :aria-expanded="choosingTemplate" @click="choosingTemplate = !choosingTemplate">
          {{ choosingTemplate ? 'Close templates' : 'Change template' }}
        </AppButton>
        <AppButton v-if="!selectedTemplateApplied" variant="primary" @click="applySelectedTemplate">Apply {{ selectedTemplate.name }}</AppButton>
      </div>
    </section>
    <div v-if="choosingTemplate" id="structure-template-options" class="structure-workspace__templates" aria-label="Choose a structure template">
      <button v-for="template in structureTemplates" :key="template.id" :aria-pressed="selectedTemplateId === template.id" @click="selectTemplate(template.id)">
        <strong>{{ template.name }}</strong>
        <small>{{ template.description }}</small>
        <em>Best for {{ template.bestFor.toLocaleLowerCase() }}</em>
      </button>
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
