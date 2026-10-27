<script setup lang="ts">
import type { AdminShopListEntry } from '~/domains/shops/api/contracts/admin-shops.contract'
import { formatShopCurrency } from '~/domains/shops/utils/shop-presentation'
import { formatCommissionPercent } from '~/domains/finance/utils/finance-presentation'
import { useAdminCommissionSchedule } from '~/domains/finance/queries/commission-schedule.query'
import { formatShopJoinedDate } from './finance-presentation'

const props = defineProps<{
  shop: AdminShopListEntry
}>()

const { data: commission } = useAdminCommissionSchedule(() => props.shop.id)

/**
 * A missing value is shown as an em dash rather than an empty cell or a guess.
 * A rejected or missing commission read is the same "no value" as an absent
 * schedule, so it never becomes a card-level error.
 */
const commissionLabel = computed(() => {
  const schedule = commission.value?.schedule

  return schedule ? formatCommissionPercent(schedule.rate_basis_points) : '—'
})

function display(value?: string | null) {
  return value?.trim() ? value : '—'
}
</script>

<template>
  <UCard>
    <h2 class="text-lg font-semibold text-text-strong">
      Shop information
    </h2>

    <div class="mt-4 grid gap-4 border-t border-border-subtle pt-4 text-sm sm:grid-cols-2">
      <div class="space-y-1">
        <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
          Email
        </div>
        <div class="break-words text-text-muted">
          {{ display(shop.owner_email) }}
        </div>
      </div>

      <div class="space-y-1">
        <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
          Slug
        </div>
        <div class="break-all text-text-muted">
          {{ display(shop.slug) }}
        </div>
      </div>

      <div class="space-y-1">
        <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
          Currency
        </div>
        <div class="text-text-muted">
          {{ display(formatShopCurrency(shop.currency)) }}
        </div>
      </div>

      <div class="space-y-1">
        <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
          Commission
        </div>
        <div class="text-text-muted">
          {{ commissionLabel }}
        </div>
      </div>

      <div class="space-y-1">
        <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
          Time joined
        </div>
        <div class="text-text-muted">
          {{ display(formatShopJoinedDate(shop.created_at)) }}
        </div>
      </div>
    </div>
  </UCard>
</template>
