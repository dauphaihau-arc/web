<script setup lang="ts">
import type { CreatePromoCodeFormState } from '~/domains/shop/schemas/promo-code/create-promo-code-form.schema'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'

defineProps<{
  disabled: boolean
}>()

const maxRedemptions = defineModel<CreatePromoCodeFormState['max_redemptions']>('maxRedemptions', { required: true })
const maxRedemptionsPerBuyer = defineModel<CreatePromoCodeFormState['max_redemptions_per_buyer']>('maxRedemptionsPerBuyer', { required: true })
</script>

<template>
  <WrapperFormGroupCard>
    <template #title>
      Redemption limits
    </template>
    <template #content>
      <div class="space-y-5">
        <UFormGroup
          label="Total redemptions"
          name="max_redemptions"
          description="The most times this promo code can be redeemed across all buyers. Leave blank for unlimited."
          class="grid grid-cols-4 items-center gap-10"
        >
          <UInput
            v-model="maxRedemptions"
            v-numeric
            :disabled="disabled"
            type="number"
            min="1"
            step="1"
            size="lg"
            class="w-32"
            placeholder="No limit"
          />
        </UFormGroup>

        <UFormGroup
          label="Redemptions per buyer"
          name="max_redemptions_per_buyer"
          description="The most times each buyer can redeem this code. Buyers must sign in before it can be used. Leave blank for unlimited."
          class="grid grid-cols-4 items-center gap-10"
        >
          <UInput
            v-model="maxRedemptionsPerBuyer"
            v-numeric
            :disabled="disabled"
            type="number"
            min="1"
            step="1"
            size="lg"
            class="w-32"
            placeholder="No limit"
          />
        </UFormGroup>
      </div>
    </template>
  </WrapperFormGroupCard>
</template>
