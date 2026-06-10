<script lang="ts" setup>
import type { ProductSuggestion } from '~/shared/api/product/contracts/product.contract'
import { useGetProductSuggestions } from '~/shared/server-state/product/products.query'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{ show: boolean }>()

const route = useRoute()
const router = useRouter()
const limit = 5
const MIN_SEARCH_LENGTH = 2

const state = reactive({
  search: '',
})

watch(() => [route.query.search, props.show], () => {
  if (!props.show) {
    state.search = ''
    return
  }

  state.search = typeof route.query.search === 'string' ? route.query.search : ''
})

const trimmedSearch = computed(() => state.search.trim())
const canFetchSuggestions = computed(() => trimmedSearch.value.length >= MIN_SEARCH_LENGTH)
const params = computed(() => canFetchSuggestions.value
  ? {
      limit,
      search: trimmedSearch.value,
    }
  : undefined)

const {
  data: dataGetSuggestions,
  refetch: refetchGetSuggestions,
  isFetching: isFetchingGetSuggestions,
  isFetched: isFetchedGetSuggestions,
} = useGetProductSuggestions(params, {
  enabled: false,
})

const redirectSearch = () => {
  if (!trimmedSearch.value) {
    return
  }

  router.push(routes.search({ search: trimmedSearch.value }))
}

watchDebounced(
  () => state.search,
  () => {
    if (!props.show || !canFetchSuggestions.value) {
      return
    }

    refetchGetSuggestions()
  },
  { debounce: 500, maxWait: 1000 },
)

const suggestedProducts = computed(() => canFetchSuggestions.value
  ? dataGetSuggestions.value?.items ?? []
  : [])

const shouldShowNoResults = computed(() =>
  canFetchSuggestions.value
  && isFetchedGetSuggestions.value
  && !isFetchingGetSuggestions.value
  && suggestedProducts.value.length === 0,
)

function getHighlightedParts(text: string) {
  const query = trimmedSearch.value.toLocaleLowerCase()

  if (!query) {
    return [{ text, isMatch: false }]
  }

  const lowerText = text.toLocaleLowerCase()
  const parts: Array<{ text: string, isMatch: boolean }> = []
  let startIndex = 0

  while (startIndex < text.length) {
    const matchIndex = lowerText.indexOf(query, startIndex)

    if (matchIndex === -1) {
      parts.push({ text: text.slice(startIndex), isMatch: false })
      break
    }

    if (matchIndex > startIndex) {
      parts.push({ text: text.slice(startIndex, matchIndex), isMatch: false })
    }

    parts.push({
      text: text.slice(matchIndex, matchIndex + query.length),
      isMatch: true,
    })
    startIndex = matchIndex + query.length
  }

  return parts
}

function openSuggestedProduct(product: ProductSuggestion) {
  router.push(routes.productDetail(product.shop.slug, product.slug))
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
            v-if="suggestedProducts.length > 0"
            class="mt-8"
          >
            <div class="mb-2 ml-4 text-[12px] text-text-muted">
              Suggested Products
            </div>

            <div class="ml-2 flex flex-col gap-1">
              <button
                v-for="prod of suggestedProducts"
                :key="prod.id"
                type="button"
                class="product"
                @click="openSuggestedProduct(prod)"
              >
                <AppIcon
                  name="search"
                  class="w-3 shrink-0"
                />
                <div class="truncate text-left">
                  <span
                    v-for="(part, index) of getHighlightedParts(prod.title)"
                    :key="`${prod.id}-${index}`"
                    :class="part.isMatch ? 'font-bold text-text-strong' : undefined"
                  >
                    {{ part.text }}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </transition>

        <div
          v-if="props.show && state.search.trim().length > 0 && state.search.trim().length < MIN_SEARCH_LENGTH"
          class="mt-6 ml-4 text-[12px] text-text-muted"
        >
          Type at least {{ MIN_SEARCH_LENGTH }} characters to search.
        </div>

        <div
          v-else-if="shouldShowNoResults"
          class="mt-6 ml-4 text-[12px] text-text-muted"
        >
          No matching products.
        </div>

        <div
          v-else-if="trimmedSearch && suggestedProducts.length === 0 && !isFetchingGetSuggestions"
          class="mt-6 ml-4 text-[12px] text-text-muted"
        >
          Press Enter to search for "{{ trimmedSearch }}".
        </div>
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
  @apply flex w-full items-center gap-2 rounded px-2 py-1 text-[12px]
  font-normal text-text-muted hover:bg-surface-muted
}
</style>
