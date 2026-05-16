<script lang="ts" setup>
import CreateShopForm from '~/app/components/account/shop/create-shop-form.vue'

definePageMeta({ middleware: ['auth', 'shop'] })
</script>

<template>
  <CreateShopForm />
</template>
