<script setup lang="ts">
import type { Category } from '~/shared/api/category/categories'
import { useGetCategories } from '~/shared/server-state/category/categories.query'

const emit = defineEmits<
  { (e: 'onChangeCategory', value: Category['id']): void }
>()

const state = reactive({
  input: '',
  categoriesName: [] as string[],
  name: '' as Category['name'],
  parentId: null as Category['id'] | null,
  isOpen: false,
  rootCategories: [] as Category[],
  requiredCategories: [],
  categoryToEmit: '',
})

const subCategories = ref<{
  [key: string]: {
    name: Category['name']
    categories: Category[]
  }
}>({})

const params = computed(() => ({
  parent_id: state.parentId ?? undefined,
}))

const { isPending, data } = useGetCategories(params.value)

onMounted(() => {
  if (!state.rootCategories.length && data.value) {
    state.rootCategories = data.value
  }
})

watch(() => data.value, () => {
  if (data.value) {
    subCategories.value[state.parentId as string] = {
      name: state.name,
      categories: data.value,
    }
    state.categoriesName = Object.values(subCategories.value).map(item => item.name)
    // if (data.value.length === 0 && state.requiredCategories.length === 0) {
    //   state.requiredCategories = data.value.map(cg => cg.id);
    //   console.log('state-required-categories', state.requiredCategories);
    // }
  }
})

const onSelectRootCategory = ({ id: category_id, name }: Category) => {
  subCategories.value = {}
  state.parentId = category_id
  state.name = name
  state.categoriesName.push(name)
}

const onSelectSubCategory = ({ parentId, id: category_id, name }: Category) => {
  if (category_id === state.parentId) {
    return
  }
  subCategories.value[parentId as string].categories.forEach((subCategory) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete subCategories.value[subCategory.id]
  })
  state.parentId = category_id
  state.name = name
}

const onSave = () => {
  state.input = state.categoriesName[state.categoriesName.length - 1]
  state.isOpen = false
  emit('onChangeCategory', state.parentId as string)
}
</script>

<template>
  <div>
    <UInput
      v-model="state.input"
      icon="i-heroicons-magnifying-glass-20-solid"
      size="xl"
      color="white"
      :trailing="false"
      placeholder="Search..."
      @click="state.isOpen = true"
    />

    <div
      v-if="state.categoriesName.length > 0"
      class="mt-3"
    >
      <h3 class="mb-2 text-sm font-semibold">
        Shoppers will find this product in all of these categories:
      </h3>
      <div class="flex gap-3">
        <div
          v-for="name of state.categoriesName"
          :key="name"
        >
          <UBadge
            color="gray"
            variant="solid"
          >
            {{ name }}
          </UBadge>
        </div>
      </div>
    </div>

    <UModal
      v-model="state.isOpen"
      :ui="{
        margin: '!mb-72',
        width: 'w-full sm:max-w-xl',
      }"
    >
      <div class="space-y-5 p-8">
        <div class="space-y-1.5">
          <h1 class="text-2xl font-bold">
            Select Category
          </h1>
        </div>

        <div class="rounded-lg bg-zinc-200/50 p-3">
          <div class="mb-5">
            <UInput
              icon="i-heroicons-magnifying-glass-20-solid"
              size="md"
              class="w-1/2"
              color="white"
              :trailing="false"
              placeholder="Search..."
            />
          </div>
        </div>

        <div class="rounded-lg bg-zinc-200/50 p-3">
          <div
            v-if="isPending && state.rootCategories.length === 0"
            class="grid place-content-center p-5"
          >
            <UIcon
              name="i-mingcute-loading-fill"
              class="size-14 animate-spin"
            />
          </div>
          <div v-else>
            <div class="flex gap-3 bg-white">
              <div
                v-if="state.rootCategories"
                class="py-2"
              >
                <div
                  v-for="cate of state.rootCategories"
                  :key="cate.id"
                >
                  <div
                    class="item-category"
                    @click="() => onSelectRootCategory(cate)"
                  >
                    <div
                      class="cursor-pointer"
                      :class="subCategories[cate.id] && 'text-primary'"
                    >
                      {{ cate.name }}
                    </div>
                    <UIcon name="i-heroicons-chevron-right" />
                  </div>
                </div>
              </div>

              <UDivider
                orientation="vertical"
                class="h-72 w-2"
              />

              <div>
                <div v-if="Object.values(subCategories).length > 0">
                  <div class="flex gap-3">
                    <div
                      v-for="(item, key) of subCategories"
                      :key="key"
                    >
                      <div
                        v-for="cate of item.categories"
                        :key="cate.name"
                      >
                        <!--                        <div -->
                        <!--                          class="cursor-pointer" -->
                        <!--                          :class="subCategories[cate.id] && 'text-red-500'" -->
                        <!--                          @click="() => onSelectSubCategory(cate)" -->
                        <!--                        > -->
                        <!--                          {{ cate.name }} -->
                        <!--                        </div> -->

                        <div class="item-category">
                          <div
                            class="cursor-pointer"
                            :class="subCategories[cate.id] && 'text-red-500'"
                            @click="() => onSelectSubCategory(cate)"
                          >
                            {{ cate.name }}
                          </div>
                          <UIcon name="i-heroicons-chevron-right" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2">
          <UButton
            size="sm"
            color="gray"
            @click="state.isOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            :disabled="(data?.length ?? 1) > 0"
            size="sm"
            @click="onSave"
          >
            Save
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<style scoped>
.item-category {
 @apply flex justify-between items-center hover:text-primary cursor-pointer gap-2 px-3 py-2;
}
</style>
