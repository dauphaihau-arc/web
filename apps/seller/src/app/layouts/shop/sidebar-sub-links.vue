<script setup lang="ts">
import type { LinkItem } from './sidebar.types'
import { isRouteActive } from '~/shared/navigation/routes'

const { data } = defineProps<{ data: LinkItem }>()

const route = useRoute()

const isOpen = ref(false)

const itemsLinkPaths = Array.isArray(data.sub)
  ? data.sub.flatMap(item => item.matchPath ? [item.matchPath] : [])
  : false

function isActive(path?: string) {
  return !!path && route.path.startsWith(path)
}
</script>

<template>
  <div v-if="!itemsLinkPaths" />
  <div v-else>
    <div
      :class="[
        'link-default w-full cursor-pointer border-l-2 border-transparent pl-2 pr-3 ',
        itemsLinkPaths.some(path => route.path.startsWith(path)) && '!border-primary border-l-2',
      ]"
      @click="isOpen = !isOpen"
    >
      <div
        class="link-theme flex w-full items-center justify-between gap-2"
        :class="[
          itemsLinkPaths.some(path => route.path.startsWith(path)) ? 'link-active' : 'link-inactive',
        ]"
      >
        <div class="flex items-center gap-2">
          <AppIcon
            v-if="data.icon"
            :name="data.icon"
            size="xs"
            class="shrink-0"
          />
          <span>{{ data.title }}</span>
        </div>

        <AppIcon
          :name="isOpen ? 'chevronUp' : 'chevronDown'"
          size="xs"
          class="shrink-0"
        />
      </div>
    </div>

    <transition name="slide-down">
      <div v-if="isOpen">
        <div class="ml-3 mt-3 pl-3 pr-7">
          <div
            v-for="(item, index) in data.sub"
            :key="index"
          >
            <div
              class="flex"
              :class="[item.disabled && 'opacity-50']"
            >
              <UDivider
                :ui="{ border: { base: isActive(item.matchPath) ? 'border-primary' : '' } }"
                orientation="vertical"
                class="h-auto w-4"
              />

              <NuxtLink
                :to="item?.disabled ? '' : item.to"
                class="link-default link-theme w-full"
                :class="[
                  item.disabled
                    ? 'cursor-not-allowed text-customGray-900'
                    : isActive(item.matchPath) || isRouteActive(route.path, item.to || '')
                      ? 'link-active'
                      : 'link-inactive',
                ]"
              >
                {{ item.title }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url("~/app/assets/css/layout-shop.css");

.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.3s ease-in-out;
}

.slide-down-enter-to,
.slide-down-leave-from {
  overflow: hidden;
  max-height: 100px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  overflow: hidden;
  max-height: 0;
}
</style>
