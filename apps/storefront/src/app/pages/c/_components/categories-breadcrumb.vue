<script lang="ts" setup>
import { resolveAppIconCssClass } from '@arc/ui/foundation/app-icon.constants'
import type { CategoryAncestryEntry } from '~/domains/category/api/contracts/category.contract'
import { buildCategoryPath } from '~/shared/navigation/route-paths'

const props = withDefaults(defineProps<{
  ancestry: CategoryAncestryEntry[]
  name?: string
  totalProducts?: number
  loading: boolean
  /** The mobile layout renders breadcrumb and heading in separate sticky zones. */
  showBreadcrumb?: boolean
  showHeading?: boolean
}>(), {
  showBreadcrumb: true,
  showHeading: true,
})

const breadcrumbLinks = computed(() => props.ancestry.map(entry => ({
  label: entry.name,
  to: buildCategoryPath(entry.slug, entry.id),
})))
</script>

<template>
  <div>
    <UBreadcrumb
      v-if="showBreadcrumb && breadcrumbLinks.length > 1"
      :divider="resolveAppIconCssClass('chevronRight')"
      :links="breadcrumbLinks"
      :ui="{ active: 'text-text-subtle' }"
    />
    <div
      v-if="showHeading"
      class="flex items-center gap-2 text-2xl font-semibold capitalize lg:mb-2"
    >
      <span>{{ name }}</span>
      <USkeleton
        v-if="loading"
        class="h-8 w-16"
      />
      <span v-else>( {{ totalProducts ?? 0 }} )</span>
    </div>
  </div>
</template>
