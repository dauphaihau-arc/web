<script setup lang="ts">
import Header from './header.vue'
import Sidebar from './sidebar/sidebar.vue'
</script>

<template>
  <div class="bg-layout-shop">
    <div class="fixed right-0 z-[1] h-full w-1/2 bg-white" />
    <div class="flex min-h-screen max-w-shop-layout xl:mx-auto">
      <Sidebar />
      <div class="h-full w-shop-layout-sidebar shrink-0" />

      <div class="relative z-[2] h-full grow bg-white">
        <Header />
        <main class="min-h-screen pt-20">
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
