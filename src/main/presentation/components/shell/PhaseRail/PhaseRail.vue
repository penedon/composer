<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { phases, type Phase } from '@presentation/router/router'
import { useProjectStore } from '@presentation/stores/project.store'

import PhaseIcon from './PhaseIcon.vue'

const props = defineProps<{ collapsed?: boolean }>()

const labels: Record<Phase, string> = { story: 'Story', frame: 'Frame', emotions: 'Emotions', structure: 'Structure', compose: 'Compose', arrange: 'Arrange', export: 'Export' }
const descriptions: Partial<Record<Phase, string>> = {
  structure: 'Sections · bars · flow',
  compose: 'Lyrics · chords · phrases',
  arrange: 'Tracks · sequences · dynamics',
}
const setupPhases = ['story', 'frame', 'emotions'] as const
const workbenchPhases = ['compose', 'arrange'] as const

const route = useRoute()
const store = useProjectStore()
const current = computed(() => String(route.params.phase) as Phase)
const isSetupPhase = computed(() => setupPhases.includes(current.value as (typeof setupPhases)[number]))

const setupStatus = computed<Record<(typeof setupPhases)[number], boolean>>(() => ({
  story: Boolean(store.project?.story.some((block) => block.text.trim())),
  frame: Boolean(store.project?.frame.key.trim() && store.project.frame.meter.trim() && store.project.frame.tempo),
  emotions: Boolean(store.project?.emotionPlan.featured.length),
}))
const completedSetupCount = computed(() => Object.values(setupStatus.value).filter(Boolean).length)
const setupReady = computed(() => completedSetupCount.value === setupPhases.length)
const setupPreference = ref(false)
const setupExpanded = computed(() => isSetupPhase.value || setupPreference.value)
const projectPath = computed(() => `/projects/${store.project?.id ?? route.params.projectId}`)

const storySummary = computed(() => {
  const text = store.project?.story.find((block) => block.text.trim())?.text.trim() ?? 'Not started'
  return text.length > 34 ? `${text.slice(0, 31)}…` : text
})
const frameSummary = computed(() => store.project ? `${store.project.frame.key} · ${store.project.frame.tempo} BPM · ${store.project.frame.meter}` : 'Not started')
const emotionSummary = computed(() => store.project?.emotionPlan.featured.map((emotion) => emotion.name).join(' · ') || 'Not started')
const setupSummaries = computed<Record<(typeof setupPhases)[number], string>>(() => ({
  story: storySummary.value,
  frame: frameSummary.value,
  emotions: emotionSummary.value,
}))

function setupStorageKey(projectId: string): string {
  return `composer:sidebar:setup-expanded:${projectId}`
}

function restoreSetupPreference(projectId: string | undefined): void {
  if (!projectId) return
  const saved = localStorage.getItem(setupStorageKey(projectId))
  setupPreference.value = saved === null ? !setupReady.value : saved === 'true'
}

function toggleSetup(): void {
  if (isSetupPhase.value || !store.project) return
  setupPreference.value = !setupPreference.value
  localStorage.setItem(setupStorageKey(store.project.id), String(setupPreference.value))
}

watch(() => store.project?.id, restoreSetupPreference, { immediate: true })
</script>

<template>
  <nav class="phase-rail" :class="{ 'phase-rail--collapsed': props.collapsed }" aria-label="Composition phases">
    <div class="phase-rail__mobile-context" aria-label="Current composition area">
      <template v-if="isSetupPhase">
        <RouterLink
          v-for="phase in setupPhases"
          :key="`mobile-setup-${phase}`"
          :class="{ 'phase-rail__mobile-context-link--active': current === phase }"
          :to="`${projectPath}/${phase}`"
          :aria-current="current === phase ? 'page' : undefined"
        >{{ labels[phase] }}</RouterLink>
      </template>
      <template v-else>
        <span><PhaseIcon :phase="current" />{{ labels[current] }}</span>
        <small>{{ descriptions[current] ?? (current === 'structure' ? 'Sections · arc · flow' : 'Project files · MIDI') }}</small>
      </template>
    </div>

    <div class="phase-rail__mobile-destinations">
      <RouterLink
        :class="{ 'phase-rail__mobile-destination--active': isSetupPhase }"
        :to="`${projectPath}/${isSetupPhase ? current : 'story'}`"
        :aria-current="isSetupPhase ? 'page' : undefined"
        aria-label="Setup"
      ><PhaseIcon phase="story" /><span>Setup</span></RouterLink>
      <RouterLink :class="{ 'phase-rail__mobile-destination--active': current === 'structure' }" :to="`${projectPath}/structure`" :aria-current="current === 'structure' ? 'page' : undefined" aria-label="Map"><PhaseIcon phase="structure" /><span>Map</span></RouterLink>
      <RouterLink :class="{ 'phase-rail__mobile-destination--active': current === 'compose' }" :to="`${projectPath}/compose`" :aria-current="current === 'compose' ? 'page' : undefined" aria-label="Compose"><PhaseIcon phase="compose" /><span>Compose</span></RouterLink>
      <RouterLink :class="{ 'phase-rail__mobile-destination--active': current === 'arrange' }" :to="`${projectPath}/arrange`" :aria-current="current === 'arrange' ? 'page' : undefined" aria-label="Arrange"><PhaseIcon phase="arrange" /><span>Arrange</span></RouterLink>
      <RouterLink :class="{ 'phase-rail__mobile-destination--active': current === 'export' }" :to="`${projectPath}/export`" :aria-current="current === 'export' ? 'page' : undefined" aria-label="Export"><PhaseIcon phase="export" /><span>Export</span></RouterLink>
    </div>

    <div class="phase-rail__desktop">
    <template v-if="props.collapsed">
      <p class="sr-only">Composition phases</p>
      <RouterLink
        v-for="phase in phases"
        :key="phase"
        class="phase-rail__icon-link"
        :class="{ 'phase-rail__icon-link--active': current === phase }"
        :to="`${projectPath}/${phase}`"
        :aria-label="labels[phase]"
        :aria-current="current === phase ? 'page' : undefined"
        :title="labels[phase]"
      >
        <PhaseIcon :phase="phase" />
      </RouterLink>
    </template>

    <template v-else>
      <p class="phase-rail__eyebrow">SONG</p>
      <section class="phase-rail__setup" :class="{ 'phase-rail__setup--active': isSetupPhase }">
        <button
          class="phase-rail__setup-toggle"
          type="button"
          :aria-expanded="setupExpanded"
          aria-controls="song-setup-links"
          :aria-label="isSetupPhase ? 'Song setup, current workspace' : `${setupExpanded ? 'Collapse' : 'Expand'} Song setup`"
          :disabled="isSetupPhase"
          @click="toggleSetup"
        >
          <span class="phase-rail__setup-status" :class="{ 'phase-rail__setup-status--ready': setupReady }" aria-hidden="true">{{ setupReady ? '✓' : completedSetupCount }}</span>
          <span class="phase-rail__setup-copy">
            <strong>Song setup</strong>
            <small>Story · Frame · Emotions</small>
            <small class="phase-rail__setup-progress">{{ completedSetupCount }} of 3 ready</small>
          </span>
          <span class="phase-rail__chevron" :class="{ 'phase-rail__chevron--open': setupExpanded }" aria-hidden="true">⌄</span>
        </button>

        <div
          id="song-setup-links"
          class="phase-rail__setup-links"
          :class="{ 'phase-rail__setup-links--compact': !setupExpanded }"
        >
          <RouterLink
            v-for="(phase, index) in setupPhases"
            :key="phase"
            class="phase-rail__setup-link"
            :class="{ 'phase-rail__setup-link--active': current === phase }"
            :to="`${projectPath}/${phase}`"
            :aria-label="labels[phase]"
            :aria-current="current === phase ? 'page' : undefined"
          >
            <span class="phase-rail__step">{{ index + 1 }}</span>
            <span><strong>{{ labels[phase] }}</strong><small v-show="setupExpanded">{{ setupSummaries[phase] }}</small></span>
            <span v-if="setupStatus[phase]" class="phase-rail__complete" aria-label="Ready">✓</span>
          </RouterLink>
        </div>
      </section>

      <p class="phase-rail__eyebrow phase-rail__eyebrow--section">SONG MAP</p>
      <RouterLink
        class="phase-rail__destination"
        :class="{ 'phase-rail__destination--active': current === 'structure' }"
        :to="`${projectPath}/structure`"
        :aria-current="current === 'structure' ? 'page' : undefined"
      >
        <span class="phase-rail__destination-icon"><PhaseIcon phase="structure" /></span>
        <span><strong>Structure</strong><small>{{ store.project?.sections.length ?? 0 }} sections · {{ store.project?.sections.reduce((sum, section) => sum + section.bars, 0) ?? 0 }} bars</small></span>
      </RouterLink>

      <p class="phase-rail__eyebrow phase-rail__eyebrow--section">WORKBENCH</p>
      <RouterLink
        v-for="phase in workbenchPhases"
        :key="phase"
        class="phase-rail__destination phase-rail__destination--primary"
        :class="{ 'phase-rail__destination--active': current === phase }"
        :to="`${projectPath}/${phase}`"
        :aria-current="current === phase ? 'page' : undefined"
      >
        <span class="phase-rail__destination-icon"><PhaseIcon :phase="phase" /></span>
        <span><strong>{{ labels[phase] }}</strong><small>{{ descriptions[phase] }}</small></span>
      </RouterLink>

      <div class="phase-rail__divider" />
      <RouterLink
        class="phase-rail__destination phase-rail__destination--export"
        :class="{ 'phase-rail__destination--active': current === 'export' }"
        :to="`${projectPath}/export`"
        :aria-current="current === 'export' ? 'page' : undefined"
      >
        <span class="phase-rail__destination-icon"><PhaseIcon phase="export" /></span>
        <span><strong>Export</strong><small>MIDI · project file</small></span>
      </RouterLink>

      <div v-if="store.project" class="phase-rail__compass">
        <p class="phase-rail__eyebrow">CREATIVE COMPASS</p>
        <strong>{{ store.project.emotionPlan.dominantFamily }}</strong>
        <small>{{ store.project.emotionPlan.featured.map((item) => item.name).join(' · ') }}</small>
      </div>
    </template>
    </div>
  </nav>
</template>

<style scoped src="./PhaseRail.scss" lang="scss" />
