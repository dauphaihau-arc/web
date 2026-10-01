<script setup lang="ts">
import { useShopBulkStopSales } from '~/domains/shop/mutations/bulk-stop-sales.mutation'

const props = defineProps<{
  ids: string[]
  scheduledCount: number
  activeCount: number
}>()

const dialog = useModal()
const { mutateAsync: bulkStopSales, isPending } = useShopBulkStopSales()

const description = computed(() => {
  const parts: string[] = []

  if (props.scheduledCount > 0) {
    parts.push(`${props.scheduledCount} scheduled ${props.scheduledCount === 1 ? 'sale' : 'sales'} will be cancelled`)
  }
  if (props.activeCount > 0) {
    parts.push(`${props.activeCount} active ${props.activeCount === 1 ? 'sale' : 'sales'} will be ended`)
  }

  return `${parts.join(' and ')}. Both actions are permanent and cannot be undone. Sales that already ended or were cancelled are skipped, and every stopped sale keeps its definition and order history.`
})

async function confirmStop() {
  await bulkStopSales({ ids: props.ids })
  await dialog.close()
}

const actions = computed(() => [
  {
    id: 'keep-sales',
    label: 'Keep sales',
    variant: 'secondary' as const,
    shortcut: 'escape' as const,
    allowWhileInputFocused: true,
    disabled: isPending,
    run: () => dialog.close(),
  },
  {
    id: 'confirm-stop-sales',
    label: 'Cancel and end sales',
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
        Stop {{ ids.length }} sales
      </h1>
      <p class="text-sm text-text-muted">
        {{ description }}
      </p>
    </div>
  </BaseDialog>
</template>
