<script setup lang="ts">
import SubLinks from './sub-links.vue'
import type { LinkItem } from './sidebar.types'
import { shopSidebarItems } from './navigation-items'

const route = useRoute()

const itemsLinkSidebar: LinkItem[] = shopSidebarItems
</script>

<template>
  <div class="relative flex flex-col gap-1">
    <div
      v-for="(item, index) of itemsLinkSidebar"
      :key="index"
    >
      <SubLinks
        v-if="item?.sub || !item.to"
        :data="item"
      />

      <div
        v-else
        class="flex w-full"
      >
        <UDivider
          :ui="{ border: { base: item.matchPath && route.path.startsWith(item.matchPath) ? 'border-primary' : 'border-transparent' } }"
          orientation="vertical"
          class="h-auto w-[3px]"
          size="sm"
        />

        <UTooltip
          text="Feature not available"
          :prevent="!item.disabled"
          class="flex-1"
        >
          <NuxtLink
            :to="item?.disabled ? '' : item.to"
            prefetch
            class="link-default link-theme ml-2 mr-4 flex !w-full items-center gap-2"
            :class="[
              'pl-5',
              item.disabled
                ? 'cursor-not-allowed text-text-strong opacity-50'
                : item.matchPath && route.path.startsWith(item.matchPath) ? 'link-active' : 'link-inactive',
            ]"
          >
            <AppIcon
              v-if="item.icon"
              :name="item.icon"
              size="xs"
              class="shrink-0"
            />
            <span>{{ item.title }}</span>
          </NuxtLink>
        </UTooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.link-default {
  @apply font-medium text-sm;
}

.link-theme {
  @apply py-1.5 px-3 rounded-md transition-all duration-200;
}

.link-active {
  @apply text-primary hover:bg-primary/5;
}

.link-inactive {
  @apply text-text-strong hover:bg-customGray-200/50;
}
</style>
