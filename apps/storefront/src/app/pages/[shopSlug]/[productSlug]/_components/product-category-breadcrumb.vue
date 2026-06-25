<script lang="ts" setup>
import { resolveAppIconCssClass } from '@arc/ui/foundation/app-icon.constants'
import { getRoutePath, routes } from '~/shared/navigation/routes'
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract'

const props = defineProps<{
  categoryPath?: GetDetailProductBySlugResponse['category_path']
}>()

const breadcrumbLinks = computed(() => {
  const categoryPath = props.categoryPath

  if (!categoryPath?.length) {
    return []
  }

  return categoryPath.map((category, index) => ({
    label: category.name,
    to: getRoutePath(routes.category(categoryPath.slice(0, index + 1).map(item => item.slug))),
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
