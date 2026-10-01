<script setup lang="ts">
import { useShopStopSale } from '~/domains/shop/mutations/stop-sale.mutation'
import type { ShopSaleStopAction } from '~/domains/shop/mutations/stop-sale.mutation'

const props = defineProps<{
  saleId: string
  action: ShopSaleStopAction
}>()

const dialog = useModal()
const { mutateAsync: stopSale, isPending } = useShopStopSale()

const copy = computed(() => props.action === 'cancel'
  ? {
      title: 'Cancel sale',
      description: 'This scheduled sale has not started. Cancelling is permanent, so it will never run. The sale and its product targets stay in your list.',
      confirmLabel: 'Cancel sale',
    }
  : {
      title: 'End sale',
      description: 'This sale is running now. Ending it is permanent, so buyers stop receiving it immediately. The sale and its product targets stay in your list.',
      confirmLabel: 'End sale',
    })

async function confirmStop() {
  await stopSale({ saleId: props.saleId, action: props.action })
  await dialog.close()
}

const actions = computed(() => [
  {
    id: 'keep-sale',
    label: 'Keep sale',
    variant: 'secondary' as const,
    shortcut: 'escape' as const,
    allowWhileInputFocused: true,
    disabled: isPending,
    run: () => dialog.close(),
  },
  {
    id: 'confirm-stop',
    label: copy.value.confirmLabel,
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
        {{ copy.title }}
      </h1>
      <p class="text-sm text-text-muted">
        {{ copy.description }}
      </p>
    </div>
  </BaseDialog>
</template>
