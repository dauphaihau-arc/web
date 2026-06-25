<script lang="ts" setup>
import { resolveAppIconCssClass } from '@arc/ui/foundation/app-icon.constants'
import type { CategoriesBreadcrumbStorage } from '~/shared/stores/market/market.store.types'

const route = useRoute()
const marketStore = useMarketStore()

defineProps<{
  totalProducts?: number
  loading: boolean
}>()

const currentNameCategory = computed(() => {
  return marketStore.categoriesBreadcrumb.at(-1)?.name
})

const categoriesBreadcrumb = computed(() => {
  if (marketStore.categoriesBreadcrumb.length === 0) {
    return null
  }
  return marketStore.categoriesBreadcrumb.map((c: CategoriesBreadcrumbStorage) => ({ label: c.name, to: c.to }))
})

// on redirect to parent category, clear sub categories
watch(() => route.fullPath, () => {
  if (marketStore.categoriesBreadcrumb.length > 0) {
    const isRedirectParentCategory = route.fullPath !== marketStore.categoriesBreadcrumb.at(-1)?.to
    if (isRedirectParentCategory) {
      for (let i = 0; i < marketStore.categoriesBreadcrumb.length - 1; i++) {
        if (route.fullPath === marketStore.categoriesBreadcrumb[i].to) {
          marketStore.categoriesBreadcrumb = marketStore.categoriesBreadcrumb.slice(0, i + 1)
          return
        }
      }
    }
  }
}, { immediate: true })
</script>

<template>
  <div>
    <UBreadcrumb
      v-if="categoriesBreadcrumb && route.params.categories.length > 1"
      :divider="resolveAppIconCssClass('chevronRight')"
      :links="categoriesBreadcrumb"
      :ui="{ active: 'text-text-subtle' }"
    />
    <div class="mb-2 flex items-center gap-2 text-2xl font-semibold capitalize">
      <span>{{ currentNameCategory }}</span>
      <USkeleton
        v-if="loading"
        class="h-8 w-16"
      />
      <span v-else>( {{ totalProducts ?? 0 }} )</span>
    </div>
  </div>
</template>
