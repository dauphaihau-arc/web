<script setup lang="ts">
import ShopDropdown from './shop-dropdown.vue'
import SidebarNavigation from './sidebar-navigation/sidebar-navigation.vue'

const isOpen = ref(false)
</script>

<template>
  <aside
    class="fixed z-[3] h-full w-shop-layout-sidebar border-r border-border-subtle"
    :class="[{ 'bg-layout-shop': !isOpen }]"
  >
    <ShopDropdown />

    <SidebarNavigation />
  </aside>
</template>
