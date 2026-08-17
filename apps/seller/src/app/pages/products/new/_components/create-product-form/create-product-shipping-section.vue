<script setup lang="ts">
import type { CreateProductShipping } from '~/domains/shop/api/product/contracts/form.contract'
import FormGroupCard from '~/app/components/wrapper-form-group-card.vue'

defineProps<{
  shipping?: CreateProductShipping
}>()

defineEmits<{
  edit: []
}>()
</script>

<template>
  <section
    id="product-shipping"
    class="scroll-mt-24"
  >
    <FormGroupCard>
      <template #title>
        Shipping
      </template>
      <template #subtitle>
        Give shoppers clear expectations about delivery time and cost by
        making sure your shipping info is accurate,
        including the shipping profile and your order processing schedule.
      </template>
      <template #content>
        <div>
          <UFormGroup
            class="mb-4"
            label="Shipping option"
            name="shipping"
            required
          >
            <div class="flex items-center gap-3">
              <div
                v-if="shipping"
                class="text-text-subtle"
              >
                {{ shipping.process_time }} processing time, from {{ shipping.zip }}
              </div>
              <UButton
                color="gray"
                variant="solid"
                @click="$emit('edit')"
              >
                {{ shipping ? 'Edit' : 'Add' }} shipping
              </UButton>
            </div>
          </UFormGroup>
        </div>
      </template>
    </FormGroupCard>
  </section>
</template>
