<script lang="ts" setup>
import { CreateCouponPageTypes } from '@arc/enums/shop'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import CreatePromoCodeForm from '~/app/components/account/shop/coupons/create-promo-code-form.vue'
import RunSaleForm from '~/app/components/account/shop/coupons/run-sale-form.vue'
import { ROUTES } from '~/shared/config/enums/routes'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const route = useRoute()

if (!route.query?.type) {
  navigateTo(`${ROUTES.ACCOUNT}${ROUTES.SHOP}`)
}
</script>

<template>
  <LayoutShopWrapperContent v-if="route.query.type === CreateCouponPageTypes.PROMO_CODE">
    <template #title>
      Create a promo code
    </template>
    <template #description>
      A promo code is an easy way to share a discount with anyone you choose.
      It can also be a great way to encourage purchases and build loyalty.
    </template>
    <template #content>
      <div class="mb-20">
        <CreatePromoCodeForm />
      </div>
    </template>
  </LayoutShopWrapperContent>
  <LayoutShopWrapperContent v-else-if="route.query.type === CreateCouponPageTypes.SALE">
    <template #title>
      Set up a sale
    </template>
    <template #description>
      Basic info
      Running a sale can help you clear out inventory,
      attract new customers, and encourage shoppers to spend more.
      The discount you offer is totally up to you.
    </template>
    <template #content>
      <div class="mb-20">
        <RunSaleForm />
      </div>
    </template>
  </LayoutShopWrapperContent>
</template>
