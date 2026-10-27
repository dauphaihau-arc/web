<script setup lang="ts">
import ShopsPageContent from './_components/shops-page-content.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})
</script>

<template>
  <ShopsPageContent />
</template>
