<script setup lang="ts">
withDefaults(defineProps<{
  contentClass?: string
}>(), {
  contentClass: '',
})

const slots = useSlots()
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-text-strong">
          <slot name="title" />
        </h1>
        <p
          v-if="slots.description"
          class="text-sm text-text-subtle"
        >
          <slot name="description" />
        </p>
      </div>
      <slot name="actions" />
    </div>
    <div :class="contentClass">
      <slot name="content" />
    </div>
  </div>
</template>

<style scoped>

</style>
