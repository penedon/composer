<script setup lang="ts">
import { AppButton } from '@presentation/components/base/AppButton'
import { useProjectStore } from '@presentation/stores/project.store'
import { addStoryBlock, updateStoryBlock, updateStoryLabel } from '@domain/project/project.operations'

const store = useProjectStore()
</script>

<template>
  <section v-if="store.project" class="story-workspace">
    <p class="eyebrow">STORY WORKSPACE</p>
    <h1 class="page-heading">Write the song before writing the music.</h1>
    <p class="page-copy">Write freely. Narrative labels are optional handles for organizing the change you want the listener to experience.</p>
    <article class="story-workspace__paper paper">
      <p class="story-workspace__kicker">WORKING PREMISE</p>
      <input
        class="story-workspace__title"
        :value="store.project.title"
        aria-label="Song title"
        @change="store.mutate('Rename project', (project) => ({ ...project, title: ($event.target as HTMLInputElement).value }))"
      />
      <div v-for="block in store.project.story" :key="block.id" class="story-workspace__block">
        <label><span class="sr-only">Optional narrative label</span><select :value="block.label ?? ''" @change="store.mutate('Change story label', (project) => updateStoryLabel(project, block.id, ($event.target as HTMLSelectElement).value || null))"><option value="">No label</option><option>Premise</option><option>Conflict</option><option>Turning point</option><option>Resolution</option><option>Image</option></select></label>
        <textarea
          :value="block.text"
          :aria-label="block.label ? `${block.label} text` : 'Story text'"
          rows="3"
          @input="store.mutate('Edit story', (project) => updateStoryBlock(project, block.id, ($event.target as HTMLTextAreaElement).value))"
        />
      </div>
      <AppButton variant="secondary" @click="store.mutate('Add story block', addStoryBlock)">+ Add thought</AppButton>
    </article>
  </section>
</template>

<style scoped src="./StoryWorkspace.scss" lang="scss" />
