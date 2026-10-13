<script lang="ts" setup>
import { useCategoryIdentityBlocked } from '~/domains/_shared/category-identity-guard'

// The legacy catch-all route never renders category content: the `category`
// middleware resolves the permanently owned path and issues a 301 to the
// current canonical URL (or a genuine 404 when no single owner exists). It only
// renders when the client/backend identity contract mismatched, so the shopper
// sees the scoped update card instead of a blank page.
definePageMeta({ layout: 'market', middleware: 'category' })

const { blocked, checking, checkForUpdate } = useCategoryIdentityBlocked()
</script>

<template>
  <div class="pt-12">
    <CategoryIdentityUpdateCard
      v-if="blocked"
      :checking="checking"
      @check="checkForUpdate"
    />
  </div>
</template>
