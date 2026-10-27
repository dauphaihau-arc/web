<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { useAdminShopPayable } from '~/domains/finance/queries/payable.query'
import { formatFinanceAmount } from '~/domains/finance/utils/finance-presentation'

const props = defineProps<{
  shopId: string
}>()

const {
  data: payable,
  isPending,
  isError,
  refetch,
} = useAdminShopPayable(() => props.shopId)
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Seller payable
    </div>

    <div
      v-if="isPending"
      class="mt-4"
    >
      <USkeleton class="h-5 w-24" />
      <USkeleton class="mt-4 h-8 w-32" />
      <USkeleton class="mt-4 h-8 w-32" />
    </div>

    <Empty
      v-else-if="isError || !payable"
      class="mt-4"
      variant="subtle"
      :icon="ICON_NAME_BY_ALIAS.warning"
      title="Unable to load balance"
      description="Something went wrong while loading this shop's payable."
    >
      <template #actions>
        <UButton
          color="gray"
          size="sm"
          @click="refetch()"
        >
          Try again
        </UButton>
      </template>
    </Empty>

    <div
      v-else
      class="mt-4"
    >
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-sm text-text-muted">
            Available
          </div>
          <div class="mt-1 text-2xl font-semibold text-text-strong">
            {{ formatFinanceAmount(payable.available_minor, payable.currency) }}
          </div>
        </div>

        <div>
          <div class="text-sm text-text-muted">
            Pending available
          </div>
          <div class="mt-1 text-2xl font-semibold text-text-strong">
            {{ formatFinanceAmount(payable.not_yet_available_minor, payable.currency) }}
          </div>
        </div>
      </div>

      <p class="mt-4 border-t border-border-subtle pt-4 text-xs text-text-subtle">
        Held in {{ payable.currency }}. Pending funds release after delivery.
      </p>
    </div>
  </UCard>
</template>
