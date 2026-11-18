<script setup lang="ts">
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'
import type { OrderPackageLine } from './order-detail-presentation'
import OrderItemLines from './order-item-lines.vue'

defineOptions({ name: 'OrderAwaitingItemsCard' })

defineProps<{
  lines: OrderPackageLine[]
}>()

const t = useAccountTranslator()
</script>

<template>
  <UCard :ui="{ divide: 'divide-y-0' }">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-base font-medium text-text-strong">
        {{ t('account.orders.progress.itemsAwaitingShipment') }}
      </h3>

      <div class="text-sm text-text-subtle">
        {{ t('account.orders.progress.noTrackingYet') }}
      </div>
    </div>

    <OrderItemLines
      :lines="lines"
      class="mt-4"
    />
  </UCard>
</template>
