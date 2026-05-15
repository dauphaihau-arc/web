<script setup lang="ts">

</script>

<template>
  <div class="bg-layout-shop">
    <div class="fixed right-0 z-[1] h-full w-1/2 bg-white" />
    <div class="max-w-shop-layout flex min-h-screen xl:mx-auto">
      <LayoutShopSidebar />
      <div class="w-shop-layout-sidebar h-full shrink-0" />

      <div class="relative z-[2] h-full grow bg-white">
        <LayoutShopHeader />
        <main class="mt-20 min-h-screen px-10">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
