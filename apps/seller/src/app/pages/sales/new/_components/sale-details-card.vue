<script setup lang="ts">
import type { CreateSaleFormState } from '~/domains/shop/schemas/sale/create-sale-form.schema'
import WrapperFormGroupCard from '~/shared/ui/wrapper-form-group-card.vue'

defineProps<{
  disabled: boolean
}>()

const name = defineModel<CreateSaleFormState['name']>('name', { required: true })
const percentOff = defineModel<CreateSaleFormState['percent_off']>('percentOff', { required: true })
</script>

<template>
  <WrapperFormGroupCard>
    <template #title>
      Sale details
    </template>
    <template #content>
      <div class="space-y-5">
        <UFormGroup
          label="Sale name"
          name="name"
          description="Buyers won’t see this. It is only for you to track the sale, and does not need to be unique."
          class="grid grid-cols-4 gap-10"
          required
        >
          <UInput
            v-model="name"
            placeholder="Ex. Autumn sale"
            :disabled="disabled"
            :maxlength="255"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup
          label="Percentage off"
          name="percent_off"
          description="Every eligible product’s current regular price is reduced by this percentage."
          class="grid grid-cols-4 items-center gap-10"
          required
        >
          <UInput
            v-model.number="percentOff"
            v-numeric
            v-max-number="99"
            :disabled="disabled"
            type="number"
            size="lg"
            class="w-32"
          >
            <template #trailing>
              <span class="text-xs text-text-muted">%</span>
            </template>
          </UInput>
        </UFormGroup>
      </div>
    </template>
  </WrapperFormGroupCard>
</template>
