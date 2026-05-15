<script lang="ts" setup>
import CreateShopForm from '~/modules/pages/account/shop/create-shop-form.vue'

definePageMeta({ middleware: ['auth', 'shop'] })
</script>

<template>
  <CreateShopForm />
</template>
