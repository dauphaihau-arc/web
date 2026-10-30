<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { OrderPackageLine } from './order-detail-presentation'

defineOptions({ name: 'OrderItemLines' })

defineProps<{
  lines: OrderPackageLine[]
}>()
</script>

<template>
  <ul class="space-y-4">
    <li
      v-for="line in lines"
      :key="line.id"
      class="flex flex-wrap items-start gap-x-3 gap-y-2 sm:flex-nowrap sm:gap-4"
    >
      <NuxtImg
        v-if="line.imageUrl"
        :src="line.imageUrl"
        densities="1"
        width="72"
        height="72"
        class="size-12 shrink-0 rounded-xl border border-border-subtle object-cover md:size-[72px]"
      />

      <div class="min-w-0 flex-1">
        <div class="font-medium text-text-strong">
          {{ line.title }}
        </div>

        <div
          v-if="line.variantLabels.length"
          class="text-sm text-text-muted"
        >
          {{ line.variantLabels.join(' · ') }}
        </div>

        <div class="text-sm text-text-muted">
          Qty {{ line.quantity }} × {{ formatMinorCurrency(line.unitPriceMinor, line.currency) }}
        </div>
      </div>

      <div
        class="w-full font-medium text-text-strong sm:w-auto sm:pl-0"
        :class="line.imageUrl ? 'pl-[3.75rem]' : ''"
      >
        {{ formatMinorCurrency(line.amountMinor, line.currency) }}
      </div>
    </li>
  </ul>
</template>
