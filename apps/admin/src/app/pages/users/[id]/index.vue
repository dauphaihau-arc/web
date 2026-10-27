<script setup lang="ts">
import UserDetailPageContent from './_components/user-detail-page-content.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

const route = useRoute()
const userId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <UserDetailPageContent :user-id="userId" />
</template>
