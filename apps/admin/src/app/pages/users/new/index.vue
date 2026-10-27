<script setup lang="ts">
import UserCreatePageContent from './_components/user-create-page-content.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})
</script>

<template>
  <UserCreatePageContent />
</template>
