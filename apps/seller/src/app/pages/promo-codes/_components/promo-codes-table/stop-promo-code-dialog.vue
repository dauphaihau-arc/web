<script setup lang="ts">
import { useShopStopPromoCode } from '~/domains/shop/mutations/stop-promo-code.mutation'
import type { ShopPromoCodeStopAction } from '~/domains/shop/mutations/stop-promo-code.mutation'

const props = defineProps<{
  promoCodeId: string
  action: ShopPromoCodeStopAction
}>()

const dialog = useModal()
const { mutateAsync: stopPromoCode, isPending } = useShopStopPromoCode()

const copy = computed(() => props.action === 'cancel'
  ? {
      title: 'Cancel promo code',
      description: 'This scheduled promo code has not started. Cancelling is permanent, so it will never be discoverable or applied. The promo code, its code identity and its history stay in your list.',
      confirmLabel: 'Cancel promo code',
    }
  : {
      title: 'End promo code',
      description: 'This promo code is running now. Ending it is permanent, so buyers can no longer discover or apply it. The promo code, its code identity and its history stay in your list.',
      confirmLabel: 'End promo code',
    })

async function confirmStop() {
  await stopPromoCode({ promoCodeId: props.promoCodeId, action: props.action })
  await dialog.close()
}

const actions = computed(() => [
  {
    id: 'keep-promo-code',
    label: 'Keep promo code',
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
