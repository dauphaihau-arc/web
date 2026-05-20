<script setup lang="ts">
import type { Category } from '~/shared/types/category'
import type { Product } from '~/shared/types/product'
import { useGetSearchCategories } from '~/shared/server-state/category/search-categories.mutation'

const props = defineProps<{ title?: Product['title'], category?: Category | null }>()

const model = defineModel<Product['category'] | undefined>({
  required: true,
})

const selected = ref()
const querySearch = ref(props.category?.name ?? '')
const placeholder = ref('')
const hideOptions = ref(false)

const {
  isPending: isPendingGetSearchCategories,
  mutateAsync: searchCategories,
} = useGetSearchCategories()

async function search(q: Category['name']) {
  if (!q) return []

  try {
    const response = await searchCategories(q)
    hideOptions.value = false
    return response.categories
  }
  catch (error) {
    return []
  }
}

watch(selected, () => {
  model.value = selected.value.id
})

watchDebounced(
  () => props.title,
  async () => {
    if (props.title && !selected.value) {
      const categories = await search(props.title)
      if (categories) {
        placeholder.value = categories
          .map(c => c.lastNameCategory)
          .toString()
          .replaceAll(',', ', ')
      }
    }
  },
  { debounce: 500, maxWait: 1000 },
)

watch(querySearch, () => {
  if (!hideOptions.value) {
    hideOptions.value = true
  }
})
</script>

<template>
  <UFormGroup
    label="Category"
    name="category"
    class="mb-4"
    required
    description="Type a two- or three-word description of your product
             to get category suggestions that will help more shoppers find it."
  >
    <UInputMenu
      v-model="selected"
      v-model:query="querySearch"
      :search="search"
      :loading="isPendingGetSearchCategories"
      :placeholder="placeholder"
      option-attribute="lastNameCategory"
      :debounce="300"
      trailing
      by="id"
      size="lg"
      :ui-menu="{
        base: hideOptions ? 'hidden' : 'relative focus:outline-none overflow-y-auto scroll-py-1',
      }"
    >
      <template #option="{ option: categoryData }">
        <div class="space-y-1 py-1">
          <div class="flex gap-1">
            <p>{{ querySearch }} in</p>
            <p class="truncate font-bold">
              {{ categoryData.lastNameCategory }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <div
              v-for="(nameCategory, idx) in categoryData.categoriesRelated"
              :key="nameCategory"
            >
              <div class="flex items-center gap-2 text-zinc-500">
                <p>{{ nameCategory }}</p>
                <UIcon
                  v-if="categoryData.categoriesRelated[idx + 1]"
                  name="i-material-symbols:play-arrow"
                  class="size-3"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #option-empty="{ query }">
        <div class="text-zinc-500">
          <div class="">
            <q>{{ query }}</q> not found
          </div>
        <!--        <UDivider class="my-3" /> -->
        <!--        <div class="space-y-3"> -->
        <!--          <div class="flex gap-1 text-md"> -->
        <!--            <p class="flex items-center gap-2"> -->
        <!--              If you don’t see your item’s category, try being more specific. -->
        <!--            </p> -->
        <!--            <p class="underline cursor-pointer"> -->
        <!--              You can also add them manually. -->
        <!--            </p> -->
        <!--          </div> -->
        <!--        </div> -->
        </div>
      </template>
    </UInputMenu>
  </UFormGroup>
</template>
