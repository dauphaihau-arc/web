<script lang="ts" setup>
import SearchPageContent from './_components/search-page-content.vue'

definePageMeta({ layout: 'market' })

const route = useRoute()

// A search listing with no keyword has nothing to describe, so the route owns
// that contract before the listing starts any request.
if (!route.query?.search) {
  throw showError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true,
  })
}
</script>

<template>
  <SearchPageContent />
</template>
