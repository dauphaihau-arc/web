<script lang="ts" setup>
import { resolveAppIconCssClass } from '@arc/ui/foundation/app-icon.constants'
import type { CategoryAncestryEntry } from '~/domains/category/api/contracts/category.contract'
import { buildCategoryPath } from '~/shared/navigation/route-paths'

const props = defineProps<{
  ancestry: CategoryAncestryEntry[]
  name?: string
  totalProducts?: number
  loading: boolean
}>()

const breadcrumbLinks = computed(() => props.ancestry.map(entry => ({
  label: entry.name,
  to: buildCategoryPath(entry.slug, entry.id),
})))
</script>

<template>
  <div>
    <UBreadcrumb
      v-if="breadcrumbLinks.length > 1"
      :divider="resolveAppIconCssClass('chevronRight')"
      :links="breadcrumbLinks"
      :ui="{ active: 'text-text-subtle' }"
    />
    <div class="mb-2 flex items-center gap-2 text-2xl font-semibold capitalize">
      <span>{{ name }}</span>
      <USkeleton
        v-if="loading"
        class="h-8 w-16"
      />
      <span v-else>( {{ totalProducts ?? 0 }} )</span>
    </div>
  </div>
</template>
