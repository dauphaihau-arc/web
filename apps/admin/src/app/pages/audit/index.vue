<script setup lang="ts">
import AuditPageContent from './_components/audit-page-content.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})
</script>

<template>
  <AuditPageContent />
</template>
