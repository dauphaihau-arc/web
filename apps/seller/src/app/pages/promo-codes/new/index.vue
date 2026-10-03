<script lang="ts" setup>
import CreatePromoCodeForm from './_components/create-promo-code-form.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import { routes } from '~/shared/navigation/routes'

definePageMeta({ layout: 'shop', middleware: ['auth'] })
</script>

<template>
  <LayoutShopWrapperContent
    back-label="Promo codes"
    :back-to="routes.promoCodes()"
    content-class="pb-24"
  >
    <template #title>
      Create a promo code
    </template>
    <template #description>
      A promo code gives buyers a percentage or fixed amount off eligible products,
      or free shipping on their order, at checkout. Shoppers enter the code during
      checkout to apply the discount.
    </template>
    <template #content>
      <CreatePromoCodeForm />
    </template>
  </LayoutShopWrapperContent>
</template>
