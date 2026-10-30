<script setup lang="ts">
import ProgressSteps from '@arc/ui/patterns/progress-steps.vue'
import type { OrderPackageStage } from './order-detail-presentation'

defineOptions({ name: 'PackageProgressSteps' })

const props = defineProps<{
  stages: OrderPackageStage[]
  label?: string
}>()

const steps = computed(() => props.stages.map(stage => ({
  key: stage.key,
  label: stage.label,
  date: stage.detail || '—',
  state: stage.complete ? 'completed' as const : 'upcoming' as const,
})))
</script>

<template>
  <ProgressSteps
    :steps="steps"
    :aria-label="label"
  />
</template>
