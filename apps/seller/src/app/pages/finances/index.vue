<script lang="ts" setup>
import { formatMinorCurrency } from '@arc/utils'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { useShopFinancePayable } from '~/domains/shop/queries/finance-payable.query'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const { data: payable, isPending } = useShopFinancePayable()

const hasBalance = computed(() => {
  if (!payable.value) return false

  return payable.value.available_minor !== 0 || payable.value.not_yet_available_minor !== 0
})
</script>

<template>
  <LayoutShopWrapperContent content-class="pb-20">
    <template #title>
      Finances
    </template>
    <template #description>
      Your Seller Payable in your shop's currency: what can be paid out now and what is still being held.
    </template>

    <template #content>
      <div
        v-if="isPending"
        class="rounded-lg border border-border-subtle bg-surface p-5"
      >
        <USkeleton class="h-5 w-16" />
        <USkeleton class="mt-5 h-8 w-32" />
        <USkeleton class="mt-4 h-8 w-32" />
      </div>

      <div
        v-else-if="!hasBalance"
        class="rounded-lg border border-border-subtle bg-surface p-10 text-center"
      >
        <p class="text-sm font-medium text-text-strong">
          No payable balance yet
        </p>
        <p class="mt-1 text-sm text-text-subtle">
          Your available and not-yet-available balances appear here once you have sales.
        </p>
      </div>

      <div
        v-else
        class="rounded-lg border border-border-subtle bg-surface p-5"
      >
        <div class="flex items-center gap-2">
          <AppIcon
            name="revenue"
            size="xs"
            class="text-text-subtle"
          />
          <span class="text-sm font-medium text-text-muted">{{ payable?.currency }}</span>
        </div>

        <div class="mt-4">
          <div class="text-sm text-text-muted">
            Available
          </div>
          <div class="mt-1 text-2xl font-semibold text-text-strong">
            {{ formatMinorCurrency(payable?.available_minor ?? 0, payable?.currency ?? '') }}
          </div>
        </div>

        <div class="mt-4 border-t border-border-subtle pt-4">
          <div class="text-sm text-text-muted">
            Not yet available
          </div>
          <div class="mt-1 text-2xl font-semibold text-text-strong">
            {{ formatMinorCurrency(payable?.not_yet_available_minor ?? 0, payable?.currency ?? '') }}
          </div>
        </div>
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
