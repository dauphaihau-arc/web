<script setup lang="ts">
import type { ElementType } from '~/types/utils'
import type { ResponseGetOrderShops } from '~/types/request-api/order'

defineProps<{
  orderShop: ElementType<ResponseGetOrderShops['order_shops']>
}>()
</script>

<template>
  <div
    v-if="orderShop.note || orderShop.promo_coupons.length > 0"
    class="mb-6 flex gap-12"
  >
    <div
      v-if="orderShop.note"
      class="min-w-[15%] max-w-[50%]"
    >
      <div>Shop Note</div>
      <div class="text-wrap text-zinc-500/80">
        {{ orderShop.note }}
      </div>
    </div>

    <div v-if="orderShop.promo_coupons.length > 0">
      <div class="mb-1">
        Promo Codes
      </div>
      <div class="flex gap-4">
        <div
          v-for="coupon in orderShop.promo_coupons"
          :key="coupon.id"
        >
          <UBadge
            color="gray"
            variant="solid"
            size="lg"
          >
            {{ coupon.code }}
          </UBadge>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
