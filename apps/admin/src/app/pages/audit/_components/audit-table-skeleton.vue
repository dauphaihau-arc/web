<script setup lang="ts">
const rows = Array.from({ length: 8 }, (_, index) => index)
</script>

<template>
  <div class="space-y-3">
    <USkeleton class="h-9 w-full" />
    <div class="space-y-2">
      <div
        v-for="row in rows"
        :key="row"
        class="grid grid-cols-[0.9fr_1.1fr_1fr_1fr_1.2fr_0.8fr] items-center gap-4 rounded-lg border border-border-subtle p-3"
      >
        <USkeleton class="h-4 w-2/3" />
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="h-4 w-2/3" />
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-1/2" />
      </div>
    </div>
  </div>
</template>
