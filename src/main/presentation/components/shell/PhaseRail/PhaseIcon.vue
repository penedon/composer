<script setup lang="ts">
import type { Phase } from '@presentation/router/router'

defineProps<{ phase: Phase }>()
</script>

<template>
  <svg class="phase-icon" viewBox="0 0 24 24" aria-hidden="true">
    <g v-if="phase === 'story'">
      <path d="M6.5 3.5h8l3 3v14h-11z" />
      <path d="M14.5 3.5v3h3M9 11h6M9 14.5h6M9 18h4" />
    </g>
    <g v-else-if="phase === 'frame'">
      <path d="M8 20h8M10 20l1.2-12h1.6L14 20M9 8h6l-1.2-4h-3.6z" />
      <path d="M12 11v5l3-2" />
    </g>
    <g v-else-if="phase === 'emotions'">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </g>
    <g v-else-if="phase === 'structure'">
      <rect x="3.5" y="5" width="10" height="5" rx="1.5" />
      <rect x="10.5" y="14" width="10" height="5" rx="1.5" />
      <path d="M13.5 7.5h3a2 2 0 0 1 2 2V14" />
    </g>
    <g v-else-if="phase === 'compose'">
      <path d="m5 18.5 1-4 10.5-10.5 3.5 3.5L9.5 18zM14.5 6l3.5 3.5M4 21h16" />
    </g>
    <g v-else-if="phase === 'arrange'">
      <path d="M3 6h18M3 12h18M3 18h18" />
      <rect x="6" y="3.5" width="5" height="5" rx="1.5" />
      <rect x="14" y="9.5" width="5" height="5" rx="1.5" />
      <rect x="8" y="15.5" width="6" height="5" rx="1.5" />
    </g>
    <g v-else>
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
    </g>
  </svg>
</template>

<style scoped>
.phase-icon { display: block; fill: none; height: 1.1rem; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.65; width: 1.1rem; }
</style>
