<script setup lang="ts">
import LoadingSvg from '../primitives/loading-svg.vue'
</script>

<template>
  <div class="fixed inset-0 z-[100] grid place-items-center bg-surface px-4">
    <LoadingSvg :child-class="'!size-8 text-text-subtle'" />
  </div>
</template>
