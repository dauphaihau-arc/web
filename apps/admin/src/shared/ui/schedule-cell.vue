<script setup lang="ts">
defineProps<{
  /** Compact date range shown in the cell. */
  schedule: string
  /** Full wall-clock stamp of the start instant. */
  start: string
  /** Full wall-clock stamp of the end instant. */
  end: string
  /** IANA timezone the schedule was authored in. */
  timezone: string
}>()

/**
 * The stock Tooltip base is a single clipped line (`h-6` + `truncate`), which
 * cuts the stacked Start/End/Timezone lines down to the first. `override`
 * replaces that one key with an unclipped base while `defu` still fills in
 * every other tooltip default (container width, popper, arrow, transition).
 */
const tooltipUi = {
  strategy: 'override',
  base: '[@media(pointer:coarse)]:hidden px-2 py-1 text-xs font-normal relative',
} as const
</script>

<template>
  <UTooltip :ui="tooltipUi">
    <template #text>
      <div>Start: {{ start }}</div>
      <div>End: {{ end }}</div>
      <div>Timezone: {{ timezone }}</div>
    </template>
    <span>{{ schedule }}</span>
  </UTooltip>
</template>
