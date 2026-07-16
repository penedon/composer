<script setup lang="ts">
import { computed } from 'vue'

import { AppButton } from '@presentation/components/base/AppButton'
import { useProjectStore } from '@presentation/stores/project.store'

const store = useProjectStore()
const isPlaying = computed(() => store.playingSong || Boolean(store.playingPhraseId))
const status = computed(() => store.playbackError ?? (store.playingSong ? 'Playing song' : store.playingPhraseId ? 'Auditioning phrase' : 'Ready'))

function togglePlayback(): void {
  if (isPlaying.value) void store.stop()
  else void store.playSong()
}
</script>

<template>
  <footer class="transport-bar">
    <span :class="{ 'transport-bar__error': store.playbackError }" role="status">{{ status }}</span>
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
  </footer>
</template>

<style scoped src="./TransportBar.scss" lang="scss" />
