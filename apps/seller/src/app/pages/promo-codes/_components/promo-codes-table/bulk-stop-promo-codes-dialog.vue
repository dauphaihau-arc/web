<script setup lang="ts">
import { useShopBulkStopPromoCodes } from '~/domains/shop/mutations/bulk-stop-promo-codes.mutation'

const props = defineProps<{
  ids: string[]
  scheduledCount: number
  activeCount: number
}>()

const dialog = useModal()
const { mutateAsync: bulkStopPromoCodes, isPending } = useShopBulkStopPromoCodes()

const description = computed(() => {
  const parts: string[] = []

  if (props.scheduledCount > 0) {
    parts.push(`${props.scheduledCount} scheduled ${props.scheduledCount === 1 ? 'promo code' : 'promo codes'} will be cancelled`)
  }
  if (props.activeCount > 0) {
    parts.push(`${props.activeCount} active ${props.activeCount === 1 ? 'promo code' : 'promo codes'} will be ended`)
  }

  return `${parts.join(' and ')}. Both actions are permanent and cannot be undone. Promo codes that already ended or were cancelled are skipped, and every stopped promo code keeps its code identity, usages and order history.`
})

async function confirmStop() {
  await bulkStopPromoCodes({ ids: props.ids })
  await dialog.close()
}

const actions = computed(() => [
  {
    id: 'keep-promo-codes',
    label: 'Keep promo codes',
    variant: 'secondary' as const,
    shortcut: 'escape' as const,
    allowWhileInputFocused: true,
    disabled: isPending,
    run: () => dialog.close(),
  },
  {
    id: 'confirm-stop-promo-codes',
    label: 'Cancel and end promo codes',
    variant: 'danger' as const,
    shortcut: 'meta_enter' as const,
    allowWhileInputFocused: true,
    loading: isPending,
    run: confirmStop,
  },
])
</script>

<template>
  <BaseDialog :actions="actions">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">
        Stop {{ ids.length }} promo codes
      </h1>
      <p class="text-sm text-text-muted">
        {{ description }}
      </p>
    </div>
  </BaseDialog>
</template>
