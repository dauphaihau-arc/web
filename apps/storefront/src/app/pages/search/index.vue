<script lang="ts" setup>
import SearchPageContent from './_components/search-page-content.vue'

definePageMeta({ layout: 'market' })

const route = useRoute()

// A search listing with no keyword has nothing to describe, so the route owns
// that contract before the listing starts any request.
if (!route.query?.q) {
  throw showError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true,
  })
}
</script>

<template>
  <SearchPageContent class="mx-auto max-w-home-layout px-4 md:px-12 lg:px-16" />
</template>
