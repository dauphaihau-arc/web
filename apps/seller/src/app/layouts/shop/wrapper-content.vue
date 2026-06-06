<script setup lang="ts">
const slots = useSlots()
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-customGray-950">
          <slot name="title" />
        </h1>
        <p
          v-if="slots.description"
          class="text-sm text-customGray-800"
        >
          <slot name="description" />
        </p>
      </div>
      <slot name="actions" />
    </div>
    <div>
      <slot
        name="content"
        class="pb-96"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
