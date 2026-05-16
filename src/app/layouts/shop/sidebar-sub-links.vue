<script setup lang="ts">
import type { LinkItem } from './sidebar.types'

const { data } = defineProps<{ data: LinkItem }>()

const routes = useRoute()

const isOpen = ref(false)

const itemsLinkRoutes = Array.isArray(data.sub) && data.sub.map((item) => {
  return item.route
})
</script>

<template>
  <div v-if="!itemsLinkRoutes" />
  <div v-else>
    <div
      :class="[
        'link-default w-full cursor-pointer border-l-2 border-transparent pl-2 pr-3 ',
        new RegExp(itemsLinkRoutes.join('|')).test(routes.path) && '!border-primary border-l-2',
      ]"
      @click="isOpen = !isOpen"
    >
      <div
        class="link-theme flex w-full justify-between"
        :class="[
          new RegExp(itemsLinkRoutes.join('|')).test(routes.path) ? 'link-active' : 'link-inactive',
        ]"
      >
        {{ data.title }}

        <UIcon
          name="i-heroicons-plus-20-solid"
          :class="[
            'transition-all',
            isOpen ? '-rotate-45' : 'rotate-90',
          ]"
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
                :ui="{ border: { base: routes.path.indexOf(item.route as string) > -1 ? 'border-primary' : '' } }"
                orientation="vertical"
                class="h-auto w-4"
              />

              <NuxtLink
                :to="item?.disabled ? '' : item.route"
                class="link-default link-theme w-full"
                :class="[
                  item.disabled
                    ? 'cursor-not-allowed text-customGray-900'
                    : routes.path.indexOf(item.route as string) > -1 ? 'link-active' : 'link-inactive',
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
