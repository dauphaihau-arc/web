<script setup lang="ts">
import type { ElementType } from '@arc/contracts/utils'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'

defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
}>()

const t = useAccountTranslator()
</script>

<template>
  <div
    v-if="orderShop.note || orderShop.promo_codes.length > 0"
    class="mb-6 flex flex-col gap-3 md:flex-row md:gap-12"
  >
    <div
      v-if="orderShop.note"
      class="md:min-w-[15%] md:max-w-[50%]"
    >
      <div>{{ t('account.orders.shopItem.shopNote') }}</div>
      <div class="text-wrap text-text-muted">
        {{ orderShop.note }}
      </div>
    </div>

    <div v-if="orderShop.promo_codes.length > 0">
      <div class="mb-1">
        {{ t('account.orders.shopItem.promoCodes') }}
      </div>
      <div class="flex gap-4">
        <div
          v-for="promoCode in orderShop.promo_codes"
          :key="promoCode.id"
        >
          <UBadge
            color="gray"
            variant="solid"
            size="lg"
          >
            {{ promoCode.code }}
          </UBadge>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
