<script setup lang="ts">
import UsersPageContent from './_components/users-page-content.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})
</script>

<template>
  <UsersPageContent />
</template>
