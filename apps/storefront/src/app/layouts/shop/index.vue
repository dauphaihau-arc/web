<script setup lang="ts">
import Header from './header.vue'
import Sidebar from './sidebar.vue'
</script>

<template>
  <div class="bg-layout-shop">
    <div class="fixed right-0 z-[1] h-full w-1/2 bg-white" />
    <div class="max-w-shop-layout flex min-h-screen xl:mx-auto">
      <Sidebar />
      <div class="w-shop-layout-sidebar h-full shrink-0" />

      <div class="relative z-[2] h-full grow bg-white">
        <Header />
        <main class="mt-20 min-h-screen">
          <div class="shop-layout-content-inner">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
