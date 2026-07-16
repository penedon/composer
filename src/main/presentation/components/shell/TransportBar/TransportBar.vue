<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { AppButton } from '@presentation/components/base/AppButton'
import SongPositionTracker from '@presentation/components/shell/SongPositionTracker/SongPositionTracker.vue'
import { useProjectStore } from '@presentation/stores/project.store'

const store = useProjectStore()
const route = useRoute()
const inWorkspace = computed(() => route.name === 'workspace')
const isPlaying = computed(() => store.playingSong || Boolean(store.playingPhraseId) || Boolean(store.playingSectionId))
const status = computed(() => store.playbackError ?? (store.playingSong ? 'Playing song' : store.playingSectionId ? 'Looping section' : store.playingPhraseId ? 'Auditioning phrase' : 'Ready'))

function togglePlayback(): void {
  if (isPlaying.value) void store.stop()
  else void store.playSong()
}
</script>

<template>
  <footer class="transport-shell" :class="{ 'transport-shell--workspace': inWorkspace }">
    <SongPositionTracker />
    <div class="transport-bar">
      <span
        :class="{ 'transport-bar__error': store.playbackError }"
        role="status"
      >{{ status }}</span>
      <div class="transport-bar__controls">
        <AppButton
          :variant="isPlaying ? 'secondary' : 'primary'"
          :disabled="!store.project"
          :aria-label="isPlaying ? 'Stop song playback' : 'Play song'"
          @click="togglePlayback"
        >
          <span aria-hidden="true">{{ isPlaying ? '■' : '▶' }}</span>
          {{ isPlaying ? 'Stop' : 'Play song' }}
        </AppButton>
        <span><strong>{{ store.project?.frame.tempo ?? 92 }}</strong> BPM</span>
        <span>{{ store.project?.frame.meter ?? '4/4' }}</span>
        <span>{{ store.project?.frame.key ?? 'D minor' }}</span>
      </div>
      <span>{{ store.project?.title ?? '' }}</span>
    </div>
  </footer>
</template>

<style scoped src="./TransportBar.scss" lang="scss" />
