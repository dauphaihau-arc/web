<script lang="ts" setup>
import { resolveAppIconCssClass } from '@arc/ui/foundation/app-icon.constants'
import { buildCategoryPath } from '~/shared/navigation/route-paths'
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract'

const props = defineProps<{
  categoryPath?: GetDetailProductBySlugResponse['category_path']
}>()

const breadcrumbLinks = computed(() => {
  const categoryPath = props.categoryPath

  if (!categoryPath?.length) {
    return []
  }

  return categoryPath.map(category => ({
    label: category.name,
    to: buildCategoryPath(category.slug, category.id),
  }))
})
</script>

<template>
  <UBreadcrumb
    v-if="breadcrumbLinks.length > 0"
    :divider="resolveAppIconCssClass('chevronRight')"
    :links="breadcrumbLinks"
  />
</template>
