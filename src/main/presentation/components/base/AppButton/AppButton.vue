<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit'
  pressed?: boolean
}>(), { variant: 'secondary', disabled: false, type: 'button', pressed: false })
</script>

<template>
  <button class="app-button" :class="`app-button--${variant}`" :type="type" :disabled="disabled" :aria-pressed="pressed">
    <slot name="icon" />
    <span v-if="$slots.default" class="app-button__label"><slot /></span>
  </button>
</template>

<style scoped src="./AppButton.scss" lang="scss" />
