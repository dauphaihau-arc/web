<script setup lang="ts">
import type { Category } from '~/shared/models/category'
import { useGetSuggestCategories } from '~/shared/server-state/category/suggest-categories.mutation'

const props = defineProps<{ title?: string, category?: Category | null }>()

const model = defineModel<string | undefined>({
  required: true,
})

type SearchCategoryOption = {
  id: string
  label: string
  relatedCategories: string[]
}

const selected = ref<SearchCategoryOption>()
const querySuggestion = ref(props.category?.name ?? '')
const placeholder = ref('')
const hideOptions = ref(false)

const {
  isPending: isPendingGetSuggestCategories,
  mutateAsync: getCategorySuggestions,
} = useGetSuggestCategories()

function normalizeCategoryOption(category: {
  id: string
  lastNameCategory?: string
  categoriesRelated?: string[]
  last_name_category?: string
  categories_related?: string[]
}): SearchCategoryOption {
  return {
    id: category.id,
    label: category.last_name_category ?? category.lastNameCategory ?? '',
    relatedCategories: category.categories_related ?? category.categoriesRelated ?? [],
  }
}

async function suggestCategories(q: Category['name']) {
  if (!q) return []

  try {
    const response = await getCategorySuggestions(q)
    hideOptions.value = false
    return response.categories.map(normalizeCategoryOption)
  }
  catch (error) {
    return []
  }
}

watch(selected, () => {
  model.value = selected.value?.id
})

watchDebounced(
  () => props.title,
  async () => {
    if (props.title && !selected.value) {
      const categories = await suggestCategories(props.title)
      if (categories) {
        placeholder.value = categories
          .map(c => c.label)
          .toString()
          .replaceAll(',', ', ')
      }
    }
  },
  { debounce: 500, maxWait: 1000 },
)

watch(querySuggestion, () => {
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
      v-model:query="querySuggestion"
      :search="suggestCategories"
      :loading="isPendingGetSuggestCategories"
      :placeholder="placeholder"
      option-attribute="label"
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
            <p>{{ querySuggestion }} in</p>
            <p class="truncate font-bold">
              {{ categoryData.label }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-zinc-500">
            <div
              v-for="(nameCategory, idx) in categoryData.relatedCategories"
              :key="`${categoryData.id}-${nameCategory}-${idx}`"
              class="flex items-center gap-2"
            >
              <p class="break-words">
                {{ nameCategory }}
              </p>
              <UIcon
                v-if="categoryData.relatedCategories[idx + 1]"
                name="i-material-symbols:play-arrow"
                class="size-3"
              />
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
