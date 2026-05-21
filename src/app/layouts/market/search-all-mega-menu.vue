<script lang="ts" setup>
import { useGetProducts } from '~/shared/server-state/product/products.query'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{ show: boolean }>()

const route = useRoute()
const router = useRouter()
const limit = 5

const state = reactive({
  search: '',
})

watch(() => [route.query.search, props.show], () => {
  if (!route.query?.search || !props.show) {
    state.search = ''
  }
})

const params = computed(() => ({
  limit,
  search: state.search,
}))

const {
  data: dataGetProducts,
  refetch: refetchGetProducts,
} = useGetProducts(params, {
  enabled: false,
})

const redirectSearch = () => {
  router.push(routes.search({ search: state.search }))
}

watchDebounced(
  () => state.search,
  () => {
    refetchGetProducts()
  },
  { debounce: 500, maxWait: 1000 },
)

function highlightText(text: string) {
  const re = new RegExp(state.search, 'gi')
  return text.replace(re, match => `<span class="font-bold">${match}</span>`)
}
</script>

<template>
  <transition name="slide-down">
    <div v-if="props.show">
      <div class="mx-auto ml-1.5 pb-12">
        <UInput
          v-model="state.search"
          icon="i-heroicons-magnifying-glass-20-solid"
          :padded="false"
          placeholder="Search..."
          variant="none"
          autofocus
          class="w-full"
          size="xl"
          :ui="{
            size: {
              xl: 'text-2xl',
            },
          }"
          @keypress.enter="redirectSearch"
        />

        <transition name="slide-down">
          <div
            v-if="dataGetProducts?.items && dataGetProducts.items.length > 0"
            class="mt-8"
          >
            <div class="mb-2 ml-4 text-[12px]  text-gray-500">
              Suggested Searches
            </div>

            <div class="ml-2 flex flex-col gap-1">
              <div
                v-for="prod of dataGetProducts.items"
                :key="prod.id"
              >
                <div
                  class="product"
                  @click="redirectSearch"
                >
                  <AppIcon
                    name="search"
                    class="w-3"
                  />
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <div v-html="highlightText(prod.title)" />
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.3s ease-in-out;
}

.slide-down-enter-to,
.slide-down-leave-from {
  overflow: hidden;
  max-height: 150px;
}

.slide-down-enter-from,
.slide-down-leave-to {
  overflow: hidden;
  max-height: 0;
}

.product {
  @apply flex items-center gap-1 text-gray-500 font-normal text-[12px]
  hover:bg-gray-100 px-2 rounded cursor-pointer
}
</style>
