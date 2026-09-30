<script setup lang="ts">
import { computed, ref } from 'vue'
import { PromotionProductScope } from '@arc/enums/promotion'
import { formatMinorCurrency } from '@arc/utils'
import { useShopGetProducts } from '~/domains/shop/queries/product/list.query'

const props = defineProps<{
  percentOff: number
  productScope: PromotionProductScope
  productIds: string[]
}>()

const previewParams = ref({ page: 1, limit: 20 })
const { data: productsData } = useShopGetProducts(previewParams)

const rows = computed(() => {
  const items = productsData.value?.items ?? []
  const scoped = props.productScope === PromotionProductScope.SPECIFIC
    ? items.filter(item => props.productIds.includes(item.id))
    : items.filter(item => !item.state || item.state === 'active')

  return scoped.slice(0, 5).map((item) => {
    const inventory = [...item.inventory].sort((left, right) =>
      left.amount_minor - right.amount_minor)
    const currency = inventory[0]?.currency ?? 'USD'
    const regularMinor = inventory[0]?.amount_minor ?? 0

    return {
      id: item.id,
      title: item.title,
      currency,
      regularMinor,
      saleMinor: Math.round((regularMinor * (100 - props.percentOff)) / 100),
    }
  })
})
</script>

<template>
  <div>
    <div
      v-if="rows.length === 0"
      class="text-sm text-text-muted"
    >
      No products to preview yet.
    </div>
    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="row in rows"
        :key="row.id"
        class="flex items-center justify-between text-sm"
      >
        <span>{{ row.title }}</span>
        <span class="space-x-3">
          <span class="text-text-muted line-through">
            {{ formatMinorCurrency(row.regularMinor, row.currency) }}
          </span>
          <span class="font-medium">
            {{ formatMinorCurrency(row.saleMinor, row.currency) }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>
